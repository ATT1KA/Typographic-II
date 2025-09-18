export interface Typography {
    id: string;
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    letterSpacing: string;
}

export interface TypographyUpdate {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    letterSpacing?: string;
}

export interface ErrorResponse {
    message: string;
    statusCode: number;
}