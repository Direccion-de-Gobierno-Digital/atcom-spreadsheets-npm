import { ArchivosBaseObj, AtcomQueryConfig, GenericObj } from "../types";
import SheetService, { ISheetService } from "./spreadsheet-service";
let _config: AtcomQueryConfig;
let _sheetService: ISheetService;

async function getRowsFromTables(spreadSheet: string, tables: string[], useSmartObject: boolean = true) {
    let response = {} as ArchivosBaseObj;

    if (_config.debug) {
        console.log('Parameters:', spreadSheet, tables)
        console.log(`[AtcomQueryService] getRowsFromTables: ${spreadSheet} - ${tables}`)

    }
    response = await _sheetService.cargaRows(spreadSheet, tables);
    if (useSmartObject) {
        tables.forEach(table => {
            if (!response[table]) {
                throw new Error(`Table ${table} not found`);
            };
            response = mapIfRequired(response, useSmartObject, response[table]!.schema.columns);
        });
    }
    return response;
}

function mapIfRequired(response: ArchivosBaseObj, mapIsRequired: boolean, columns: Record<string, number>) {
    if (mapIsRequired) {
        for (const key in response) {
            if (Object.prototype.hasOwnProperty.call(response, key)) {
                const element = response[key];
                if (!element) continue;

                const mappedValues = element.data.map(element => mapPropertiesWithDictionary(element, columns));
                element.data = mappedValues;
            }
        }
    }
    return response;
}
function mapPropertiesWithDictionary(row: string[] | GenericObj, diccionarioColumnas?: Record<string, number>): GenericObj {

    // check if row is genericObj
    if (!Array.isArray(row)) return row; // no need to map

    const responseObj = {} as GenericObj;
    for (const key in diccionarioColumnas) {
        if (Object.prototype.hasOwnProperty.call(diccionarioColumnas, key)) {
            const index = diccionarioColumnas[key];
            const value = row[index];
            responseObj[key] = value;
        }
    }
    return responseObj;
}

const AtcomQueryService = (config: AtcomQueryConfig) => {
    _config = config;
    _sheetService = SheetService(_config);
    return {
        getRowsFromTables
    }
}

export default AtcomQueryService;