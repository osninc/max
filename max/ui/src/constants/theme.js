import { createTheme } from '@mui/material/styles';

const tableHeaderColor = '#c0dbf0';

export const defaultTheme = createTheme({
    palette: {
        primary: {
            light: '#d2ddbd',
            main: '#80a73a',
            dark: '#2d4206',
            contrastText: '#fff',
        },
        secondary: {
            light: '#ff7961',
            main: '#f44336',
            dark: '#ba000d',
            contrastText: '#000',
        },
    },
    components: {
        MuiButtonGroup: {
            styleOverrides: {
                grouped: {
                    minWidth: 6,
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 20,
                },
            },
        },
        MuiLoadingButton: {
            defaultProps: {
                // The props to change the default for.
                unstable_sx: {
                    paddingLeft: 1,
                    paddingRight: 1,
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                // Name of the slot
                root: {
                    // Some CSS
                    //border: 'solid 1px red',
                    borderRadius: 20,
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 20,
                },
            },
        },
        MuiDataGrid: {
            styleOverrides: {
                row: {
                    '& .MuiDataGrid-row:hover': {
                        backgroundColor: 'skyblue',
                        // color: 'red'
                    },
                },
                columnHeader: {
                    backgroundColor: tableHeaderColor,
                },
                columnHeaderTitle: {
                    fontWeight: 'bold',
                },
            },
        },
        MuiTableCell: {
            variants: [
                {
                    props: { variant: 'header' },
                    style: {
                        backgroundColor: tableHeaderColor,
                        fontWeight: 'bold',
                    },
                },
            ],
        },
        MuiTableHead: {
            styleOverrides: {
                backgroundColor: tableHeaderColor,
            },
        },
        MuiTabs: {
            styleOverrides: {
                indicator: {
                    bottom: 5,
                    right: 5,
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    '&.MuiButtonBase-root': {
                        color: 'black',
                        '&.Mui-Selected': {
                            color: 'black',
                            fontWeight: 'bold',
                        },
                    },
                    '&.Mui-disabled': {
                        backgroundColor: '#ccc',
                        color: 'grey',
                    },
                },
            },
            variants: [
                {
                    props: { variant: 'h' },
                    style: {
                        backgroundColor: '#d2ddbd',
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        marginRight: 10,
                        marginBottom: 5,
                    },
                },
                {
                    props: { variant: 'h', selected: true },
                    style: {
                        backgroundColor: '#80a73a',
                        color: 'black',
                        fontWeight: 'bold',
                    },
                },
                {
                    props: { variant: 'v' },
                    style: {
                        backgroundColor: '#d2ddbd',
                        borderTopLeftRadius: 20,
                        borderBottomLeftRadius: 20,
                        borderTopRightRadius: 0,
                        marginBottom: 5,
                        marginRight: 5,
                    },
                },
                {
                    props: { variant: 'v', selected: true },
                    style: {
                        backgroundColor: '#80a73a',
                        color: 'black',
                        fontWeight: 'bold',
                    },
                },
            ],
        },
    },
});
