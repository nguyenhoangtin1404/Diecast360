import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { finished } from 'node:stream/promises';
import { Readable } from 'stream';
import { Writable } from 'stream';
import { S3ServiceException } from '@aws-sdk/client-s3';
import { MediaController } from './media.controller';
import { signMediaPayload } from './signed-media.util';

const mockR2Send = jest.fn();

jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual('@aws-sdk/client-s3') as Record<string, unknown>;
  return {
    ...actual,
    S3Client: jest.fn().mockImplementation(() => ({ send: (...a: unknown[]) => mockR2Send(...a) })),
  };
});

class CollectingResponse extends Writable {
  chunks: Buffer[] = [];
  headersSent = false;
  setHeader = jest.fn();
  status = jest.fn().mockReturnThis();

  override _write(
    chunk: unknown,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string, encoding);
    this.chunks.push(buf);
    callback();
  }
}

describe('MediaController', () => {
  const secret = 's'.repeat(32);
  let tmpRoot: string;
  let uploadsRoot: string;

  beforeEach(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'dc360-media-'));
    uploadsRoot = path.join(tmpRoot, 'uploads');
    await fs.mkdir(path.join(uploadsRoot, 'images'), { recursive: true });
    await fs.writeFile(path.join(uploadsRoot, 'images', 'pic.png'), 'png-bytes');
    mockR2Send.mockReset();
  });

  afterEach(async () => {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  function controllerFromConfig(get: (key: string) => string | undefined): MediaController {
    return new MediaController({ get } as ConfigService);
  }

  it('streams file when signature is valid', async () => {
    const controller = controllerFromConfig((key) => {
      if (key === 'JWT_SECRET') return secret;
      if (key === 'UPLOAD_DIR') return uploadsRoot;
      return undefined;
    });
    const rel = 'images/pic.png';
    const { d, s } = signMediaPayload({ p: rel, exp: Date.now() + 60_000 }, secret);

    const res = new CollectingResponse();
    await controller.serveSigned(d, s, res as never);
    await finished(res);
    expect(Buffer.concat(res.chunks).toString()).toBe('png-bytes');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'inline');
    expect(mockR2Send).not.toHaveBeenCalled();
  });

  it('returns 404 when file is missing', async () => {
    const controller = controllerFromConfig((key) => {
      if (key === 'JWT_SECRET') return secret;
      if (key === 'UPLOAD_DIR') return uploadsRoot;
      return undefined;
    });
    const { d, s } = signMediaPayload(
      { p: 'images/missing.png', exp: Date.now() + 60_000 },
      secret,
    );
    const end = jest.fn();
    const status = jest.fn().mockReturnValue({ end });
    const res = {
      headersSent: false,
      status,
      setHeader: jest.fn(),
      pipe: jest.fn(),
    };
    await controller.serveSigned(d, s, res as never);
    expect(status).toHaveBeenCalledWith(404);
    expect(end).toHaveBeenCalled();
    expect(mockR2Send).not.toHaveBeenCalled();
  });

  it('rejects invalid signature', async () => {
    const controller = controllerFromConfig((key) => {
      if (key === 'JWT_SECRET') return secret;
      if (key === 'UPLOAD_DIR') return uploadsRoot;
      return undefined;
    });
    const res = new CollectingResponse();
    await expect(controller.serveSigned('bad', 'sig', res as never)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws Forbidden when signing not configured', async () => {
    const controller = controllerFromConfig(() => undefined);
    const res = new CollectingResponse();
    await expect(controller.serveSigned('x', 'y', res as never)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  describe('STORAGE_DRIVER=r2', () => {
    function r2ControllerFromConfig(
      get: (key: string) => string | undefined,
    ): MediaController {
      return new MediaController({ get } as ConfigService);
    }

    it('streams object from R2 when signature is valid', async () => {
      mockR2Send.mockResolvedValueOnce({
        Body: Readable.from([Buffer.from('r2-bytes')]),
        ContentLength: 8,
      });
      const controller = r2ControllerFromConfig((key) => {
        if (key === 'JWT_SECRET') return secret;
        if (key === 'STORAGE_DRIVER') return 'r2';
        if (key === 'R2_ACCOUNT_ID') return 'acct';
        if (key === 'R2_ACCESS_KEY_ID') return 'ak';
        if (key === 'R2_SECRET_ACCESS_KEY') return 'sk';
        if (key === 'R2_BUCKET') return 'bucket';
        return undefined;
      });
      const rel = 'images/pic.png';
      const { d, s } = signMediaPayload({ p: rel, exp: Date.now() + 60_000 }, secret);

      const res = new CollectingResponse();
      await controller.serveSigned(d, s, res as never);
      await finished(res);
      expect(mockR2Send).toHaveBeenCalledTimes(1);
      expect(Buffer.concat(res.chunks).toString()).toBe('r2-bytes');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Length', '8');
    });

    it('returns 404 when R2 object is missing', async () => {
      mockR2Send.mockRejectedValueOnce(
        new S3ServiceException({
          name: 'NoSuchKey',
          message: 'Not Found',
          $metadata: { httpStatusCode: 404 },
        } as ConstructorParameters<typeof S3ServiceException>[0]),
      );
      const controller = r2ControllerFromConfig((key) => {
        if (key === 'JWT_SECRET') return secret;
        if (key === 'STORAGE_DRIVER') return 'r2';
        if (key === 'R2_ACCOUNT_ID') return 'acct';
        if (key === 'R2_ACCESS_KEY_ID') return 'ak';
        if (key === 'R2_SECRET_ACCESS_KEY') return 'sk';
        if (key === 'R2_BUCKET') return 'bucket';
        return undefined;
      });
      const { d, s } = signMediaPayload(
        { p: 'images/missing.png', exp: Date.now() + 60_000 },
        secret,
      );
      const end = jest.fn();
      const status = jest.fn().mockReturnValue({ end });
      const res = {
        headersSent: false,
        status,
        setHeader: jest.fn(),
        pipe: jest.fn(),
      };
      await controller.serveSigned(d, s, res as never);
      expect(status).toHaveBeenCalledWith(404);
      expect(end).toHaveBeenCalled();
    });

    it('throws when R2 env is incomplete', async () => {
      const controller = r2ControllerFromConfig((key) => {
        if (key === 'JWT_SECRET') return secret;
        if (key === 'STORAGE_DRIVER') return 'r2';
        if (key === 'R2_ACCOUNT_ID') return 'acct';
        return undefined;
      });
      const { d, s } = signMediaPayload(
        { p: 'images/pic.png', exp: Date.now() + 60_000 },
        secret,
      );
      const res = new CollectingResponse();
      await expect(controller.serveSigned(d, s, res as never)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });
});
