import { Inventory } from './types'

export const DESTINATION = { CSV_LISTING: 'CSV_LISTING', CSV_DOWNLOAD: 'CSV_DOWNLOAD' }

export const DEFAULT_INVENTORIES: Inventory[] = [
    {
        geoType: 'National',
        kind: 'Monthly',
        csvUrl: 'https://econdata.s3-us-west-2.amazonaws.com/Reports/Core/RDC_Inventory_Core_Metrics_Country.csv'
    }
]

export const LABELS = {
    CSV_LISTING: 'CSV_LISTING',
    CSV_DOWNLOAD: 'CSV_DOWNLOAD'
}

export const PAGE_OPENED_LOG_MESSAGE_PROPS_TO_PICK = ['inventory']

export const OUTPUT_FIELDS = {
    GEO_TYPE: 'geoType',
    KIND: 'kind'
}

export const DEFAULT_OUTPUT = {
    csvUrl: '',
    geoType: '',
    kind: ''
}
