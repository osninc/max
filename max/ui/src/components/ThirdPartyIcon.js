
import PropTypes from "prop-types";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'

export const ThirdPartyIcon = props => {
    const { site } = props;

    let i;

    switch (site) {
        case "zillow":
            i = icon({ name: 'z' })
            break;
    }
    return <FontAwesomeIcon icon={i} {...props} />
}