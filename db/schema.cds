@cds.persistence.name: 'SALES_ORDERS'
entity SALES_ORDERS {
    key VBELN  : String(50);
        POSNR  : String(50);
        MATNR  : String(50);
        WERKS  : String(50);
        KUNNR  : String(50);
        MENGE  : Decimal(15,2);
        NETPR  : Decimal(15,2);
        AUDAT  : Date;
        EDATU  : Date;
}