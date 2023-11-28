import axios from 'axios';

const instance = axios.create({
    timeout: 600000, // 10 minutes
    //baseURL: `${process.env.REACT_APP_API_URL}`,
    responseType: 'json',
});
export default instance;
