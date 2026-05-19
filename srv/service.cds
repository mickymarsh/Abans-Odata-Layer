using { SALES_ORDERS as DB_SALES_ORDERS } from '../db/schema';

@path: '/odata/v4/abans'
service CE_SALESORDER_0001 {
    @readonly
    entity SALES_ORDERS as projection on DB_SALES_ORDERS;
}