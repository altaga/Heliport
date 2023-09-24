import { Dimensions, StyleSheet } from 'react-native';

const navbarHeight = Dimensions.get('screen').height - Dimensions.get('window').height;

let headerHeight = 60;
let footerHeight = 60;

const GlobalStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loginContainer:{
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        flex:1
      },
    input: {
        height: 40,
        borderRadius: 5,
        width: '84%',
        borderColor: '#00e599',
        borderWidth: 2,
        color: 'black',
        alignSelf: 'center',
    },
    buttonStyle: {
        backgroundColor: '#00e599',
        borderRadius: 50,
        padding: 10,
        width: Dimensions.get('window').width * .8,
        alignItems: 'center',
        borderColor: 'black',
        borderWidth: 2,
    },
    buttonStylePay: {
        backgroundColor: '#00e599',
        padding: 10,
        width: Dimensions.get('window').width * .8,
        borderRadius:50,
        alignItems: 'center',
        borderColor: 'black',
        borderWidth: 0.5,
    },
    buttonStyleDisable: {
        backgroundColor: '#5c8074',
        borderRadius: 50,
        padding: 10,
        width: Dimensions.get('window').width * .8,
        alignItems: 'center',
        borderColor: 'black',
        borderWidth: 2,
    },
    buttonStyleLogin: {
        backgroundColor: '#da00ff',
        borderRadius: 50,
        padding: 10,
        width: Dimensions.get('window').width * .8,
        alignItems: 'center',
        borderColor: '#000',
        borderWidth: 1,
    },
    buttonStyleLoginDisable: {
        backgroundColor: '#da00ff66',
        borderRadius: 50,
        padding: 10,
        width: Dimensions.get('window').width * .8,
        alignItems: 'center',
        borderColor: 'black',
        borderWidth: 2,
    },
    buttonLogoutStyle: {
        backgroundColor: `#00e599`,
        borderRadius: 50,
        padding: 10,
        width: Dimensions.get('window').width * .4,
        alignItems: 'center',
        borderColor: "black",
        borderWidth: 2
    },
    mainView: {
        borderTopWidth: 1,
        borderTopColor: `#00e599`,
        backgroundColor: "#1E2423",
        flex: 2,
    },
    container: {
        flex:1,
        flexDirection: 'column',
        justifyContent: "space-between",
        alignItems: 'center',
        height: Dimensions.get("window").height,
        width: Dimensions.get("window").width,
        backgroundColor: "#1E2423",
    },
    header: {
        height: 60,
        width: Dimensions.get("window").width,
        backgroundColor: "#161B19",
        borderBottomWidth: 1,
        borderBottomColor: `#00e599`,
        backgroundColor: "#1E2423",
    },
    headerItem: {
        alignItems: 'center',
    },
    main: {
        flex:1,
        backgroundColor: "#1E2423",
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height - (headerHeight + navbarHeight / 2),
        alignItems:"center"
    },
    footer: {
        width: Dimensions.get("window").width,
        height: 60,
        backgroundColor: "#1E2423",
        flexDirection: "row"
    },
});

export default GlobalStyles;