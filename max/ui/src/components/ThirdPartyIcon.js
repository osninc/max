import PropTypes from 'prop-types';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro';

export const ThirdPartyIcon = (props) => {
    const { site } = props;

    let i;

    switch (site) {
        case 'zillow':
            i = icon({ name: 'z' });
            break;
        case 'redfin':
            i = icon({ name: 'r' });
            break;
        case 'realtor':
            i = icon({ name: 'r' });
            break;
        case 'landwatch':
            i = icon({ name: 'l' });
            break;
        case 'mls':
            i = icon({ name: 'm' });
            break;
        default:
            break;
    }
    return <FontAwesomeIcon icon={i} {...props} />;
};

ThirdPartyIcon.propTypes = {
    site: PropTypes.string,
};
