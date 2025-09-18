import { TypographyService } from '../src/services/typography.service';
import { TypographyController } from '../src/controllers/typography.controller';

describe('TypographyController', () => {
    let typographyService: TypographyService;
    let typographyController: TypographyController;

    beforeEach(() => {
        typographyService = new TypographyService();
        typographyController = new TypographyController(typographyService);
    });

    it('should fetch typography data successfully', async () => {
        const result = await typographyController.getTypographyData();
        expect(result).toBeDefined();
        expect(result).toHaveProperty('fontFamily');
        expect(result).toHaveProperty('fontSize');
    });

    it('should handle errors when fetching typography data', async () => {
        jest.spyOn(typographyService, 'fetchData').mockImplementationOnce(() => {
            throw new Error('Fetch error');
        });

        await expect(typographyController.getTypographyData()).rejects.toThrow('Fetch error');
    });

    it('should update typography data successfully', async () => {
        const updateData = { fontFamily: 'Arial', fontSize: '16px' };
        const result = await typographyController.updateTypographyData(updateData);
        expect(result).toBeDefined();
        expect(result.fontFamily).toBe(updateData.fontFamily);
        expect(result.fontSize).toBe(updateData.fontSize);
    });

    it('should handle errors when updating typography data', async () => {
        const updateData = { fontFamily: 'Arial', fontSize: '16px' };
        jest.spyOn(typographyService, 'updateData').mockImplementationOnce(() => {
            throw new Error('Update error');
        });

        await expect(typographyController.updateTypographyData(updateData)).rejects.toThrow('Update error');
    });
});