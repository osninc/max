import React, { createContext, forwardRef, useContext, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Autocomplete, { autocompleteClasses, createFilterOptions } from '@mui/material/Autocomplete';
import useMediaQuery from '@mui/material/useMediaQuery';
import ListSubheader from '@mui/material/ListSubheader';
import Popper from '@mui/material/Popper';
import { useTheme, styled } from '@mui/material/styles';
import { VariableSizeList } from 'react-window';
import Typography from '@mui/material/Typography';

import countiesData from '../data/counties.json';

const states = [...new Set(countiesData.map((county) => county.state_id))].sort();
const counties = countiesData.map((county) => `${county.county_full}, ${county.state_id}`).sort();

const LISTBOX_PADDING = 8; // px

const filterOptions = createFilterOptions({
    matchFrom: 'start',
});

function renderRow(props) {
    const { data, index, style } = props;
    const dataSet = data[index];
    const inlineStyle = {
        ...style,
        top: style.top + LISTBOX_PADDING,
    };

    if (dataSet.hasOwnProperty('group')) {
        return (
            <ListSubheader key={dataSet.key} component="div" style={inlineStyle}>
                {dataSet.group}
            </ListSubheader>
        );
    }

    return (
        <Typography component="li" {...dataSet[0]} noWrap style={inlineStyle}>
            {dataSet[1]}
        </Typography>
    );
}

const OuterElementContext = createContext({});

const OuterElementType = forwardRef((props, ref) => {
    const outerProps = useContext(OuterElementContext);
    return <div ref={ref} {...props} {...outerProps} />;
});

function useResetCache(data) {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current != null) {
            ref.current.resetAfterIndex(0, true);
        }
    }, [data]);
    return ref;
}

// Adapter for react-window
const ListboxComponent = forwardRef(function ListboxComponent(props, ref) {
    const { children, ...other } = props;
    const itemData = [];
    children.forEach((item) => {
        itemData.push(item);
        itemData.push(...(item.children || []));
    });

    const theme = useTheme();
    const smUp = useMediaQuery(theme.breakpoints.up('sm'), {
        noSsr: true,
    });
    const itemCount = itemData.length;
    const itemSize = smUp ? 36 : 48;

    const getChildSize = (child) => {
        if (child.hasOwnProperty('group')) {
            return 48;
        }

        return itemSize;
    };

    const getHeight = () => {
        if (itemCount > 8) {
            return 8 * itemSize;
        }
        return itemData.map(getChildSize).reduce((a, b) => a + b, 0);
    };

    const gridRef = useResetCache(itemCount);

    return (
        <div ref={ref}>
            <OuterElementContext.Provider value={other}>
                <VariableSizeList
                    itemData={itemData}
                    height={getHeight() + 2 * LISTBOX_PADDING}
                    width="100%"
                    ref={gridRef}
                    outerElementType={OuterElementType}
                    innerElementType="ul"
                    itemSize={(index) => getChildSize(itemData[index])}
                    overscanCount={5}
                    itemCount={itemCount}
                >
                    {renderRow}
                </VariableSizeList>
            </OuterElementContext.Provider>
        </div>
    );
});

ListboxComponent.propTypes = {
    children: PropTypes.node,
};

// function random(length) {
//     const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//     let result = '';

//     for (let i = 0; i < length; i += 1) {
//         result += characters.charAt(Math.floor(Math.random() * characters.length));
//     }

//     return result;
// }

const StyledPopper = styled(Popper)({
    [`& .${autocompleteClasses.listbox}`]: {
        boxSizing: 'border-box',
        '& ul': {
            padding: 0,
            margin: 0,
        },
    },
});

const OPTIONS = [...counties, ...states];

const SelectLocation = (props) => {
    const { onChange, value } = props;

    return (
        <Autocomplete
            value={value}
            onInputChange={(e, v) => onChange(v)}
            onChange={(e, v) => onChange(v)}
            id="virtualize-demo"
            sx={{
                width: 300,
                //border: "1px solid red"
            }}
            disableListWrap
            PopperComponent={StyledPopper}
            ListboxComponent={ListboxComponent}
            options={OPTIONS}
            size="small"
            freeSolo
            filterOptions={filterOptions}
            renderInput={(params) => {
                return (
                    <TextField
                        size="small"
                        {...params}
                        label="Choose a county, state, or zipcode"
                        // InputProps={{
                        //     ...params.inputProps,
                        //     //startAdornment: <FontAwesomeIcon icon={icon({ name: 'map-pin' })} />,
                        // }}
                    />
                );
            }}
            renderOption={(props, option, state) => [props, option, state.index]}
        />
    );
};

SelectLocation.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func,
};

export default SelectLocation;
