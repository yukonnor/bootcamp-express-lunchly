/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
    constructor({ id, firstName, lastName, phone, notes }) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phone = phone;
        this._notes = notes;
        this.resCount = undefined;
    }

    /** getter and setter for customer notes */

    get notes() {
        return this._notes;
    }

    set notes(value) {
        // Perform validation or side effects if needed
        if (!value) {
            this._notes = "";
        } else {
            this._notes = `${value}`;
        }
    }

    /** getter for full name of the customer */

    get fullName() {
        return this.firstName + " " + this.lastName;
    }

    /** find all customers. */

    static async all() {
        const results = await db.query(
            `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
        );
        return results.rows.map((c) => new Customer(c));
    }

    /** get a customer by ID. */

    static async get(id) {
        const results = await db.query(
            `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
            [id]
        );

        const customer = results.rows[0];

        if (customer === undefined) {
            const err = new Error(`No such customer: ${id}`);
            err.status = 404;
            throw err;
        }

        return new Customer(customer);
    }

    /** Return x customers with most reservations. */

    static async bestCustomers(customerLimit = 10) {
        const results = await db.query(
            `SELECT c.id, 
                  c.first_name AS "firstName",  
                  c.last_name AS "lastName", 
                  c.phone, 
                  c.notes,
                  COUNT(r.*) as "resCount"
           FROM customers c 
           INNER JOIN reservations r ON c.id = r.customer_id 
           GROUP BY 1,2,3,4,5
           ORDER BY 6 DESC 
           LIMIT $1;`,
            [customerLimit]
        );

        return results.rows.map(function (row) {
            const customer = new Customer({
                id: row.id,
                firstName: row.firstName,
                lastName: row.lastName,
                phone: row.phone,
                notes: row.notes,
            });
            customer.resCount = row.resCount;
            return customer;
        });
    }

    /** find customers name. */

    static async nameSearchResults(nameSearched) {
        const searchTerm = `%${nameSearched}%`;
        const results = await db.query(
            `SELECT id, 
            first_name AS "firstName",  
            last_name AS "lastName", 
            phone, 
            notes
          FROM customers
          WHERE first_name ILIKE $1
          OR    last_name ILIKE $1
          OR    CONCAT(first_name, ' ', last_name) ILIKE $1
          ORDER BY last_name, first_name`,
            [searchTerm]
        );
        return results.rows.map((c) => new Customer(c));
    }

    /** get all reservations for this customer. */

    async getReservations() {
        return await Reservation.getReservationsForCustomer(this.id);
    }

    /** save this customer. */

    async save() {
        if (this.id === undefined) {
            const result = await db.query(
                `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
                [this.firstName, this.lastName, this.phone, this.notes]
            );
            this.id = result.rows[0].id;
        } else {
            await db.query(
                `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
                [this.firstName, this.lastName, this.phone, this.notes, this.id]
            );
        }
    }
}

module.exports = Customer;
