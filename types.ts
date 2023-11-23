
export type GoogleApiConfig = {
    rootFolder: string,
    fileName: string
}

export type AtcomQueryConfig = {
    credentials: GoogleApiConfig,
    debug?: boolean,
    schemas: SpreadsheetTableSchema[],
}
export type Sheet = {
    uniqueName: string,
    sheetName: string,
    range: string,
    namedRange: string,
    columns: Record<string, number>,
    typeHints: Record<string, string>,
    keyIndex: number
}
export type GenericObj = Record<string, string | number | boolean | undefined | null | Date | string[] | string[][] | object>

export type SpreadsheetTableSchema = {
    tableName: string,
    location: {
        id: string,
        sheets: Sheet[]
    },
}
export type ArchivoBaseContent = {
    data: string[][] | GenericObj[];
    schema: Sheet;
}
export type ArchivosBaseObj = Record<string, ArchivoBaseContent>
