import { Dimensions, StyleSheet } from 'react-native';

const GlobalStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    input: {
        height: 40,
        borderRadius: 5,
        width: '84%',
        borderColor: '#ffbc42',
        borderWidth: 2,
        color: 'black',
        alignSelf: 'center',
    },
    buttonStyle: {
        backgroundColor: '#ffbc42',
        borderRadius: 50,
        padding: 10,
        width: Dimensions.get('window').width * .8,
        alignItems: 'center',
        borderColor: 'black',
        borderWidth: 2,
    },
    buttonStyleLogin: {
        backgroundColor: '#ffbc42',
        borderRadius: 50,
        padding: 10,
        width: Dimensions.get('window').width * .8,
        alignItems: 'center',
        borderColor: 'black',
        borderWidth: 2,
    },
    buttonStyleLoginDisabel: {
        backgroundColor: '#5c8074',
        borderRadius: 50,
        padding: 10,
        width: Dimensions.get('window').width * .8,
        alignItems: 'center',
        borderColor: 'black',
        borderWidth: 2,
    },
    buttonLogoutStyle: {
        backgroundColor: `#ffbc42`,
        borderRadius: 50,
        padding: 10,
        width: Dimensions.get('window').width * .3,
        alignItems: 'center',
        borderColor: "black",
        borderWidth: 2
    },
    container: {
        flexDirection: 'column',
        justifyContent: "space-between",
        alignItems: 'center',
        height: Dimensions.get("window").height,
        width: Dimensions.get("window").width,
        backgroundColor: "#1E2423",
    },
    header: {
        height: 90,
        width: Dimensions.get("window").width,
        paddingTop: 10,
        backgroundColor: "#161B19",
        borderBottomWidth: 1,
        borderBottomColor: `#ffbc42`,
        backgroundColor: "#1E2423",
    },
    headerItem: {
        width: Dimensions.get("window").width / 3,
        paddingTop: 10,
        alignItems: 'center',
    },
    main: {
        height: Dimensions.get("window").height-160,
        paddingBottom:10,
    },
    footer: {
        width: Dimensions.get("window").width,
        height: 70,
        backgroundColor: "#1E2423",
        flexDirection: "row"
    }
});

export default GlobalStyles;