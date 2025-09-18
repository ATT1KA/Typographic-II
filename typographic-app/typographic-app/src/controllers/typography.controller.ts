export class TypographyController {
    private typographyService: TypographyService;

    constructor() {
        this.typographyService = new TypographyService();
    }

    public async getTypography(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const typographyData = await this.typographyService.fetchTypographyData();
            res.status(200).json(typographyData);
        } catch (error) {
            next(error);
        }
    }

    public async updateTypography(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const updatedData = await this.typographyService.updateTypographyData(req.body);
            res.status(200).json(updatedData);
        } catch (error) {
            next(error);
        }
    }
}