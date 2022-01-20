import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import * as dbUtil from './../utils/dbUtil';

interface Report {
    year: number,
    caregivers: {
        name: string,
        patients: string[]
    }[]
}

export const getReport = async (req: Request, res: Response) => {

    const sql = `
        SELECT
            caregiver.id      AS caregiver_id,
            caregiver.name    AS caregiver_name,
            patient.id        AS patient_id,
            patient.name      AS patient_name,
            visit.date        AS visit_date
        FROM caregiver
        JOIN visit ON visit.caregiver = caregiver.id
        JOIN patient ON patient.id = visit.patient
        WHERE visit.date >= '${req.params.year}-01-01' AND visit.date < '${req.params.year}-12-31'
    `;
    
    let result : QueryResult;
    try {
        result = await dbUtil.sqlToDB(sql, []);
        const report: Report = {
            year: parseInt(req.params.year),
            caregivers: []
        };

        report.caregivers = Object.values(result.rows.reduce((acc, row) => {
            const { caregiver_name, patient_name } = row;
            if (!acc[caregiver_name]) {
                acc[caregiver_name] = {name: caregiver_name, patients: []};
            }
            acc[caregiver_name].patients = acc[caregiver_name].patients.concat(patient_name);
            return acc;
        }, {}))

        res.status(200).json(report);
    } catch (error) {
        throw new Error(error.message);
    }

}
