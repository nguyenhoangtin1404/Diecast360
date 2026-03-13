import { BadRequestException, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AiDraftController } from './ai-draft.controller';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('AiDraftController', () => {
  let controller: AiDraftController;
  let aiService: { analyzeImages: jest.Mock };
  let prisma: { aiItemDraft: { create: jest.Mock } };
  let storage: {
    saveFile: jest.Mock;
    deleteFile: jest.Mock;
    getFileUrl: jest.Mock;
  };

  const analysisResult = {
    aiJson: { brand: 'MiniGT' },
    confidence: { brand: 0.91 },
    extracted_text: 'MiniGT',
  };

  const buildFile = (name: string, size: number = 1024, mimetype: string = 'image/jpeg') =>
    ({
      originalname: name,
      size,
      mimetype,
      buffer: Buffer.from(name),
    }) as Express.Multer.File;

  beforeEach(async () => {
    aiService = {
      analyzeImages: jest.fn().mockResolvedValue(analysisResult),
    };

    prisma = {
      aiItemDraft: {
        create: jest.fn().mockResolvedValue({ id: 'draft-1' }),
      },
    };

    storage = {
      saveFile: jest.fn().mockResolvedValue('drafts/test.jpg'),
      deleteFile: jest.fn().mockResolvedValue(undefined),
      getFileUrl: jest.fn((path: string) => `http://localhost/uploads/${path}`),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiDraftController],
      providers: [
        { provide: AiService, useValue: aiService },
        { provide: PrismaService, useValue: prisma },
        { provide: 'IStorageService', useValue: storage },
      ],
    }).compile();

    controller = module.get<AiDraftController>(AiDraftController);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should create a draft after analyzing and saving images', async () => {
    const result = await controller.createDraft([buildFile('box.jpg'), buildFile('bottom.jpg')]);

    expect(aiService.analyzeImages).toHaveBeenCalledWith([Buffer.from('box.jpg'), Buffer.from('bottom.jpg')]);
    expect(prisma.aiItemDraft.create).toHaveBeenCalledWith({
      data: {
        images_json: JSON.stringify([
          'http://localhost/uploads/drafts/test.jpg',
          'http://localhost/uploads/drafts/test.jpg',
        ]),
        extracted_text: analysisResult.extracted_text,
        ai_json: JSON.stringify(analysisResult.aiJson),
        confidence_json: JSON.stringify(analysisResult.confidence),
        status: 'PENDING',
      },
    });
    expect(result.draftId).toBe('draft-1');
  });

  it('should generate distinct filenames for files with the same original name', async () => {
    storage.saveFile
      .mockResolvedValueOnce('drafts/first.jpg')
      .mockResolvedValueOnce('drafts/second.jpg');

    await controller.createDraft([buildFile('same.jpg'), buildFile('same.jpg')]);

    const firstFilename = storage.saveFile.mock.calls[0][1] as string;
    const secondFilename = storage.saveFile.mock.calls[1][1] as string;
    expect(firstFilename).not.toBe(secondFilename);
  });

  it('should reject empty uploads', async () => {
    await expect(controller.createDraft([])).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should propagate analysis errors without saving or cleaning up files', async () => {
    aiService.analyzeImages.mockRejectedValueOnce(new Error('analysis failed'));

    await expect(controller.createDraft([buildFile('box.jpg')])).rejects.toThrow('analysis failed');

    expect(storage.saveFile).not.toHaveBeenCalled();
    expect(storage.deleteFile).not.toHaveBeenCalled();
    expect(prisma.aiItemDraft.create).not.toHaveBeenCalled();
  });

  it('should clean up saved files when draft persistence fails', async () => {
    storage.saveFile
      .mockResolvedValueOnce('drafts/box.jpg')
      .mockResolvedValueOnce('drafts/bottom.jpg');
    prisma.aiItemDraft.create.mockRejectedValueOnce(new Error('db write failed'));

    await expect(
      controller.createDraft([buildFile('box.jpg'), buildFile('bottom.jpg')]),
    ).rejects.toThrow('db write failed');

    expect(storage.deleteFile).toHaveBeenCalledTimes(2);
    expect(storage.deleteFile).toHaveBeenNthCalledWith(1, 'drafts/box.jpg');
    expect(storage.deleteFile).toHaveBeenNthCalledWith(2, 'drafts/bottom.jpg');
  });

  it('should clean up already-saved files when storage fails partway through', async () => {
    storage.saveFile
      .mockResolvedValueOnce('drafts/box.jpg')
      .mockRejectedValueOnce(new Error('disk full'));

    await expect(
      controller.createDraft([buildFile('box.jpg'), buildFile('bottom.jpg')]),
    ).rejects.toThrow('disk full');

    expect(storage.deleteFile).toHaveBeenCalledTimes(1);
    expect(storage.deleteFile).toHaveBeenCalledWith('drafts/box.jpg');
    expect(prisma.aiItemDraft.create).not.toHaveBeenCalled();
  });

  it('should log cleanup failures while still rethrowing the original error', async () => {
    const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    storage.saveFile.mockResolvedValueOnce('drafts/box.jpg');
    prisma.aiItemDraft.create.mockRejectedValueOnce(new Error('db write failed'));
    storage.deleteFile.mockRejectedValueOnce(new Error('cleanup failed'));

    await expect(controller.createDraft([buildFile('box.jpg')])).rejects.toThrow('db write failed');

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to cleanup draft file "drafts/box.jpg"'),
    );
  });
});
