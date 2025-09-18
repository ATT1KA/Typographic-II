export class TypographyService {
    private typographyData: any[] = [];

    constructor() {
        // Initialize with some default typography data if needed
        this.typographyData = this.loadTypographyData();
    }

    private loadTypographyData(): any[] {
        // Logic to load typography data from a source (e.g., database, file)
        return [];
    }

    public getAllTypography(): any[] {
        return this.typographyData;
    }

    public getTypographyById(id: string): any | null {
        const typography = this.typographyData.find(item => item.id === id);
        return typography || null;
    }

    public createTypography(data: any): any {
        const newTypography = { id: this.generateId(), ...data };
        this.typographyData.push(newTypography);
        return newTypography;
    }

    public updateTypography(id: string, data: any): any | null {
        const index = this.typographyData.findIndex(item => item.id === id);
        if (index === -1) {
            return null;
        }
        this.typographyData[index] = { ...this.typographyData[index], ...data };
        return this.typographyData[index];
    }

    public deleteTypography(id: string): boolean {
        const index = this.typographyData.findIndex(item => item.id === id);
        if (index === -1) {
            return false;
        }
        this.typographyData.splice(index, 1);
        return true;
    }

    private generateId(): string {
        return (Math.random() * 100000).toFixed(0);
    }
}