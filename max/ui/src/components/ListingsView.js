import { ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro';
import { useState } from 'react';
import { ImagesView } from './Listings/ImagesView';
import { GridView } from './Listings/GridView';
import { MapView } from './Listings/MapView';

const ListingsView = ({ variant, listings, onDetailsClick, source }) => {
    const [viewAs, setViewAs] = useState(variant);
    const defaultParams = {
        listings,
        onClick: (zpid) => onDetailsClick(zpid),
        source,
    };

    let finalComponent;
    switch (viewAs) {
        case 'image':
            finalComponent = <ImagesView {...defaultParams} />;
            break;
        case 'map':
            finalComponent = <MapView {...defaultParams} />;
            break;
        default:
            finalComponent = <GridView {...defaultParams} />;
            break;
    }

    return (
        <>
            <Typography variant="caption">View as:</Typography>
            <ToggleButtonGroup color="primary" value={viewAs} size="small" variant="text">
                <ToggleButton value="grid" onClick={() => setViewAs('grid')}>
                    <FontAwesomeIcon icon={icon({ name: 'table-cells' })} />
                </ToggleButton>
                <ToggleButton value="image" onClick={() => setViewAs('image')}>
                    <FontAwesomeIcon icon={icon({ name: 'image' })} />
                </ToggleButton>
                <ToggleButton value="map" onClick={() => setViewAs('map')}>
                    <FontAwesomeIcon icon={icon({ name: 'map-location-dot' })} />
                </ToggleButton>
            </ToggleButtonGroup>
            {finalComponent}
        </>
    );
};

ListingsView.propTypes = {
    variant: PropTypes.oneOf(['image', 'grid', 'map']),
    listings: PropTypes.array.isRequired,
    onDetailsClick: PropTypes.func,
    source: PropTypes.string,
};

ListingsView.defaultProps = {
    variant: 'grid',
};

export default ListingsView;
