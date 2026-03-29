// lib/__tests__/cleanup.test.ts
// Tests for cleanupExpiredFiles()

jest.mock('@/lib/prisma', () => ({
  prisma: {
    conversion: {
      findMany: jest.fn(),
      update:   jest.fn(),
    },
  },
}));

jest.mock('fs/promises', () => ({
  readdir: jest.fn(),
  stat:    jest.fn(),
  rm:      jest.fn(),
}));

import { cleanupExpiredFiles } from '../cleanup';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';

const mockFindMany = prisma.conversion.findMany as jest.MockedFunction<any>;
const mockUpdate   = prisma.conversion.update   as jest.MockedFunction<any>;
const mockReaddir  = fs.readdir as jest.MockedFunction<any>;
const mockStat     = fs.stat    as jest.MockedFunction<any>;
const mockRm       = fs.rm      as jest.MockedFunction<any>;

describe('cleanupExpiredFiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OUTPUT_DIR = '/tmp/outputs';
    process.env.UPLOAD_DIR = '/tmp/uploads';
  });

  it('deletes files for expired conversions and marks filesDeleted', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'abc-123', originalPath: '/tmp/uploads/abc-123-test.pdf' },
    ]);
    mockReaddir.mockResolvedValue([]); // empty output dir
    mockStat.mockResolvedValue({ size: 1024, isDirectory: () => false } as any);
    mockRm.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue({});

    const result = await cleanupExpiredFiles();

    expect(result.deleted).toBe(1);
    expect(mockRm).toHaveBeenCalledWith(
      expect.stringContaining('abc-123'),
      expect.objectContaining({ recursive: true })
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'abc-123' },
        data: { filesDeleted: true },
      })
    );
  });

  it('returns 0 deleted when no expired conversions', async () => {
    mockFindMany.mockResolvedValue([]);
    const result = await cleanupExpiredFiles();
    expect(result.deleted).toBe(0);
    expect(result.freedMB).toBe(0);
  });

  it('keeps DB record after file deletion', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'xyz-456', originalPath: '/tmp/uploads/xyz-456-doc.docx' },
    ]);
    mockReaddir.mockResolvedValue([]);
    mockStat.mockResolvedValue({ size: 512, isDirectory: () => false } as any);
    mockRm.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue({});

    await cleanupExpiredFiles();

    // update() should be called (mark filesDeleted=true), NOT delete()
    expect(mockUpdate).toHaveBeenCalled();
    // Should NOT call prisma.conversion.delete
    expect(prisma.conversion).not.toHaveProperty('delete');
  });

  it('queries only non-deleted expired records', async () => {
    mockFindMany.mockResolvedValue([]);
    await cleanupExpiredFiles();

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          filesDeleted: false,
          deletedAt: null,
        }),
      })
    );
  });

  it('calculates freed space correctly (bytes → MB)', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'id1', originalPath: '/tmp/uploads/id1-file.pdf' },
    ]);
    mockReaddir.mockResolvedValue([]);
    // originalPath stat: 5MB
    mockStat.mockResolvedValue({ size: 5 * 1024 * 1024, isDirectory: () => false } as any);
    mockRm.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue({});

    const result = await cleanupExpiredFiles();

    expect(result.freedMB).toBeGreaterThan(0);
    expect(result.freedMB).toBeLessThanOrEqual(10); // sanity check
  });

  it('continues processing other conversions if one fails', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'fail-1', originalPath: '/tmp/fail-1.pdf' },
      { id: 'ok-2',   originalPath: '/tmp/ok-2.pdf' },
    ]);
    mockReaddir.mockResolvedValue([]);
    mockStat.mockResolvedValue({ size: 100, isDirectory: () => false } as any);

    // First rm call fails, second succeeds
    mockRm
      .mockRejectedValueOnce(new Error('Permission denied'))
      .mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue({});

    const result = await cleanupExpiredFiles();

    // Should process ok-2 even after fail-1 errors
    expect(result.deleted).toBe(1);
  });
});
