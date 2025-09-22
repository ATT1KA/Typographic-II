import { Request, Response, NextFunction } from 'express';
import { TypographyService } from '../services/typography.service';

export default class TypographyController {
    private typographyService: TypographyService;

    constructor() {
        this.typographyService = new TypographyService();
    }

    public async getTypography(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const typographyData = this.typographyService.getAllTypography();
            res.status(200).json(typographyData);
        } catch (error) {
            next(error);
        }
    }

    public async updateTypography(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const { id, ...payload } = req.body || {};
            const updatedData = this.typographyService.updateTypography(id, payload);
            if (!updatedData) return res.status(404).json({ message: 'Not found' });
            res.status(200).json(updatedData);
        } catch (error) {
            next(error);
        }
    }
}