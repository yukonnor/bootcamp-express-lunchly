/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");

/** A reservation for a party */

class Reservation {
    constructor({ id, customerId, startAt, notes }) {
        this.id = id;
        this.customerId = customerId;
        this._numGuests = undefined;
        this.startAt = startAt;
        this.notes = notes;
    }

    /** getter and setter for numGuests */

    get numGuests() {
        return this._numGuests;
    }

    set numGuests(value) {
        // Perform validation or side effects if needed
        if (Number.isInteger(value) && value > 0) {
            this._numGuests = value;
        } else {
            throw new Error("Number of guests on reservation must be a positive number.");
        }
    }

    /** formatter for startAt */

    getformattedStartAt() {
        return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
    }

    /** given a customer id, find their reservations. */

    static async getReservationsForCustomer(customerId) {
        const results = await db.query(
            `SELECT id, 
           customer_id AS "customerId", 
           num_guests AS "numGuests", 
           start_at AS "startAt", 
           notes AS "notes"
         FROM reservations 
         WHERE customer_id = $1`,
            [customerId]
        );

        return results.rows.map(function (row) {
            const reservation = new Reservation(row);
            reservation.numGuests = row.numGuests;
            return reservation;
        });
    }

    /** save (or create) this reservation. */

    async save() {
        if (this.id === undefined) {
            const result = await db.query(
                `INSERT INTO reservations (customer_id, start_at, num_guests, notes)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id`,
                [this.customerId, this.startAt, this.numGuests, this.notes]
            );
            this.id = result.rows[0].id;
        } else {
            await db.query(
                `UPDATE reservations SET customer_id=$1, start_at=$2, num_guests=$3, notes=$4
                 WHERE id=$5`,
                [this.customerId, this.startAt, this.numGuests, this.notes, this.id]
            );
        }
    }
}

module.exports = Reservation;
