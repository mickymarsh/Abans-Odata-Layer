/**
 * Service Registry — basePath is RELATIVE to the mount point /sap/opu/odata4/sap
 * 
 * Express mounts routes at /sap/opu/odata4/sap, so servicePath receives:
 *   z_inventory_health/srvd_a2x/sap/inventoryhealth/0001
 * 
 * Therefore basePath should NOT include /sap/opu/odata4/sap prefix.
 */
const ODATA_NAMESPACE = 'sap.abans';
const ODATA_MOUNT = '/sap/opu/odata4/sap';

const SERVICES = {
  Z_C_INVENTORY_HEALTH_0001: {
    name: 'Z_C_INVENTORY_HEALTH_0001',
    // RELATIVE path — what Express sees after /sap/opu/odata4/sap
    basePath: 'z_inventory_health/srvd_a2x/sap/inventoryhealth/0001',
    type: 'custom',
    writable: false,
    entitySets: {
      'Z_DeadStockSet': {
        keys: ['Material', 'Plant', 'StorageLocation'],
        sourceTable: '"C_DeadStock"',
        fields: {
          'Material':            { type: 'Edm.String', maxLength: 18, nullable: false, dbField: 'MATNR' },
          'Plant':               { type: 'Edm.String', maxLength: 4,  nullable: false, dbField: 'WERKS' },
          'StorageLocation':     { type: 'Edm.String', maxLength: 4,  nullable: false, dbField: 'LGORT' },
          'MaterialDescription': { type: 'Edm.String', maxLength: 40, nullable: true,  dbField: 'MAKTX' },
          'PlantName':           { type: 'Edm.String', maxLength: 30, nullable: true,  dbField: 'PLANT_NAME' },
          'StorageLocationName': { type: 'Edm.String', maxLength: 16, nullable: true,  dbField: 'LOCATION_NAME' },
          'StockQty':            { type: 'Edm.Decimal', precision: 13, scale: 3, nullable: false, dbField: 'STOCK_QTY' },
          'StockValue':          { type: 'Edm.Decimal', precision: 15, scale: 2, nullable: true,  dbField: 'STOCK_VALUE' },
          'LastMovementDate':    { type: 'Edm.Date', nullable: true,  dbField: 'LAST_MOVEMENT_DATE' },
          'DaysSinceMovement':   { type: 'Edm.Int32', nullable: false, dbField: 'DAYS_SINCE_MOVEMENT' },
          'HealthCategory':      { type: 'Edm.String', maxLength: 20, nullable: false, dbField: 'HEALTH_CATEGORY' },
          'RiskScore':           { type: 'Edm.Int32', nullable: false, dbField: 'RISK_SCORE' },
          'ValueAtRisk':         { type: 'Edm.Decimal', precision: 15, scale: 2, nullable: false, dbField: 'VALUE_AT_RISK' },
          'SnapshotDate':        { type: 'Edm.Date', nullable: false, dbField: 'SNAPSHOT_DATE' }
        }
      }
    }
  }
};

module.exports = { ODATA_NAMESPACE, ODATA_MOUNT, SERVICES };
