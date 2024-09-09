export const validateToken = (token) => {
    const validate = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{32}$/

    return validate.test(token)
}