import { AiController } from './ai.controller';
import { AiService } from './ai.service';

describe('AiController', () => {
  let controller: AiController;
  const aiService = {
    generateItemDescription: jest.fn(),
    generateFacebookPost: jest.fn(),
  };

  beforeEach(() => {
    controller = new AiController(aiService as unknown as AiService);
    jest.clearAllMocks();
  });

  it('passes tenantId to generateItemDescription', async () => {
    aiService.generateItemDescription.mockResolvedValueOnce({ short_description: 'ok' });

    await controller.generateDescription(
      'item-1',
      { custom_instructions: 'focus rarity' },
      'shop-1',
    );

    expect(aiService.generateItemDescription).toHaveBeenCalledWith(
      'item-1',
      'shop-1',
      'focus rarity',
    );
  });

  it('passes tenantId to generateFacebookPost', async () => {
    aiService.generateFacebookPost.mockResolvedValueOnce({ content: 'post' });

    await controller.generateFbPost(
      'item-2',
      { custom_instructions: 'short' },
      'shop-2',
    );

    expect(aiService.generateFacebookPost).toHaveBeenCalledWith(
      'item-2',
      'shop-2',
      'short',
    );
  });
});
