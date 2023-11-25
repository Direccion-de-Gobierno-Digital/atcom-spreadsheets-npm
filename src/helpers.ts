import { ArchivosBaseObj } from "../types";

function findElementInArrayGenericObj<T>(rows: T[], column: number, value: string) {
    const query = rows.filter((row: T) => {
        //console.log("Comparando: ", row[column], " con ", value, " = ", row[column] === value, "");
        return row[column as keyof typeof row] === value;
    })[0] as T;
    return query;
}
function mapIfRequired<T>(response: ArchivosBaseObj<T>, mapIsRequired: boolean, columns: Record<string, number>) {
    if (mapIsRequired) {
        for (const key in response) {
            if (Object.prototype.hasOwnProperty.call(response, key)) {
                const element = response[key];
                if (!element) continue;

                const mappedValues = element.data.map(element => mapPropertiesWithDictionary(element, columns));
                element.data = mappedValues as T[];
            }
        }
    }
    return response;
}
function mapPropertiesWithDictionary<T>(row: string[] | T, diccionarioColumnas?: Record<string, number>): T {

    // check if row is genericObjT
    if (!Array.isArray(row)) return row as T; // no need to map

    const responseObj = {} as any; //ANSORRY just got lazy
    for (const key in diccionarioColumnas) {
        if (Object.prototype.hasOwnProperty.call(diccionarioColumnas, key)) {
            const index = diccionarioColumnas[key];
            const value = row[index];
            responseObj[key as keyof typeof responseObj] = value;
        }
    }
    return responseObj as T;
}
function findElementInArray<T>(rows: string[][] | T[], column: number, value: string) {
    if (isArrayOfStringArray(rows)) {
        return findElementInArrayString(rows, column, value);
    }
    else {
        return findElementInArrayGenericObj<T>(rows, column, value);
    }
}


function findElementInArrayString(rows: string[][], column: number, value: string) {
    const query = rows.filter((row: string[]) => {
        //console.log("Comparando: ", row[column], " con ", value, " = ", row[column] === value, "");
        return row[column] === value;
    })[0];
    return query;
}

function findElementsInArray<T>(rows: string[][] | T[], column: number | string, value: string) {

    if (isArrayOfStringArray(rows)) {
        return findElementsInArrayString(rows, column as number, value);
    }
    return findElementsInArrayGenericObj<T>(rows, column as string, value);

}
function findElementsInArrayGenericObj<T>(rows: T[], column: string, value: string) {
    console.log("findElementsInArrayGenericObj", rows[0]);
    const query = rows.filter((row: T) => {
        //console.log("Comparando: ", row[column], " con ", value, " = ", row[column] === value, "");
        return row[column as keyof typeof row] === value;
    });
    return query ? query : undefined;
}
function findElementInArraySmartObject<T>(rows: string[][], columnName: string, value: string, columnas: Record<string, number>, _useSmartObject = true) {
    const mappedObjects = rows.map(row => {
        const mapped = mapPropertiesWithDictionary(row, columnas);
        return mapped;
    })
    const query = mappedObjects.filter((row: string[]) => {
        //console.log("Comparando: ", row[column], " con ", value, " = ", row[column] === value, "");
        return row[columnName as keyof typeof row] === value;
    })[0];
    return query ? query : undefined;
}
function findElementsInArrayString(rows: string[][], column: number, value: string) {
    const query = rows.filter((row: string[]) => {
        //console.log("Comparando: ", row[column], " con ", value, " = ", row[column] === value, "");
        return row[column] === value;
    });
    return query ? query : undefined;
}
function isArrayOfStringArray<T>(rows: string[][] | T[]): rows is string[][] {
    return Array.isArray(rows[0]);
}
const helpers = {
    findElementInArrayGenericObj,
    mapIfRequired,
    mapPropertiesWithDictionary,
    findElementInArray,
    findElementInArraySmartObject,
    findElementsInArray,
    findElementsInArrayGenericObj,
    findElementInArrayString,
    isArrayOfStringArray
}

export default helpers;