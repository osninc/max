export const processError = (from, error) => {
    let message = `Caught from ${from} - `;
    if (error.response) {
        message = `${message} Error code ${error.response.status} - `;
        switch (error.response.status) {
            case 404:
                message = `${message} This was a bad request`;
                break;
            case 403:
                message = `${message} Failed CAPTCHA: Press & Hold to confirm you are a human (and not a bot)`;
                break;
            default:
                message = `${message} ${error.response.data.error.message}`;
                break;
        }
    } else if (error.request) {
        message = `${message} There was an error communicating with the server.  Please try again later.`;
    } else {
        //console.log({ error })
        message = `${message}${error.message}`;
    }
    return message;
};
