import axios from 'axios';

const instance = axios.create({
    timeout: 300000, // 5 minutes
    //baseURL: `${process.env.REACT_APP_API_URL}`,
    responseType: 'json' 
});
export default instance;