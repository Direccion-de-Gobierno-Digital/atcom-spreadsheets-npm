import { ArchivosBaseObj, GenericObj } from "../types";

/**
 * Searches for an element in an array of objects based on a specified column and value.
 * @param rows - The array of objects to search through.
 * @param column - The index or key of the column to compare the value against.
 * @param value - The value to search for in the specified column.
 * @returns The first object in the `rows` array that matches the specified `column` and `value`, or `undefined` if no match is found.
 */
function findElementInArrayGenericObj(rows: GenericObj[], column: number, value: string) {
    const query = rows.filter((row: GenericObj) => {
        //console.log("Comparando: ", row[column], " con ", value, " = ", row[column] === value, "");
        return row[column] === value;
    })[0];
    return query ? query : undefined;
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
function findElementInArray(rows: string[][] | GenericObj[], column: number, value: string) {
    if (isArrayOfStringArray(rows)) {
        return findElementInArrayString(rows, column, value);
    }
    else {
        return findElementInArrayGenericObj(rows, column, value);
    }
}


function findElementInArrayString(rows: string[][], column: number, value: string) {
    const query = rows.filter((row: string[]) => {
        //console.log("Comparando: ", row[column], " con ", value, " = ", row[column] === value, "");
        return row[column] === value;
    })[0];
    return query ? query : undefined;
}

function findElementsInArray(rows: string[][] | GenericObj[], column: number | string, value: string) {

    if (isArrayOfStringArray(rows)) {
        return findElementsInArrayString(rows, column as number, value);
    }
    return findElementsInArrayGenericObj(rows, column as string, value);

}
function findElementsInArrayGenericObj(rows: GenericObj[], column: string, value: string) {
    console.log("findElementsInArrayGenericObj", rows[0]);
    const query = rows.filter((row: GenericObj) => {
        //console.log("Comparando: ", row[column], " con ", value, " = ", row[column] === value, "");
        return row[column] === value;
    });
    return query ? query : undefined;
}
function findElementInArraySmartObject(rows: string[][], columnName: string, value: string, columnas: Record<string, number>, _useSmartObject = true) {
    const mappedObjects = rows.map(row => {
        const mapped = mapPropertiesWithDictionary(row, columnas);
        return mapped;
    })
    const query = mappedObjects.filter((row: GenericObj) => {
        //console.log("Comparando: ", row[column], " con ", value, " = ", row[column] === value, "");
        return row[columnName] === value;
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
function isArrayOfStringArray(rows: string[][] | GenericObj[]): rows is string[][] {
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