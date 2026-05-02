import { HttpException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './common/prisma/prisma.service';

describe('AppController', () => {
  let controller: AppController;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = moduleRef.get(AppController);
  });

  it('getHealth returns healthy when DB responds', async () => {
    await expect(controller.getHealth()).resolves.toEqual({
      ok: true,
      status: 'healthy',
    });
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('getHealth throws 503 when DB fails', async () => {
    prisma.$queryRaw.mockRejectedValueOnce(new Error('down'));
    try {
      await controller.getHealth();
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect((e as HttpException).getStatus()).toBe(503);
      return;
    }
    throw new Error('expected HttpException');
  });
});
