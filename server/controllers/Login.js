
export const Login = async (req, res) => {
    const { email, password } = req.body
    try {
        if (process.env.ENAIL_ADMIN == email && process.env.PASSWORD_ADMIN == password)
        {
            const token="generateToken(email,password)"
            res.json(token);
        }
        else{
            res.status(404).json("מייל או סיסמא לא נכונים");
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}