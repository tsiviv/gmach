import React, { useState } from "react";
import { LoginAdmin } from "../servieces/Login";
import { useNavigate } from "react-router-dom";
const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate=useNavigate()
    const fetch = async (e) => {
        e.preventDefault();
        try {
            const res = await LoginAdmin(email,password)
            console.log(res)
            sessionStorage.setItem('token', res.token)
            console.log("d")
            navigate('/people')
        }
        catch (err) {
            console.log(err)
            setError(err.response.data.error)
        }
    }

    return <>
        <div className="container pt-5" style={{ maxWidth: 400 }} dir="rtl">
            <h3 className="mb-4">התחברות למערכת</h3>
            <form onSubmit={fetch}>
                <div className="mb-3">
                    <label className="form-label">מייל</label>
                    <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">סיסמה</label>
                    <input
                        type="password"
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <div className="text-danger mb-3">{error}</div>}
                <button type="submit" className="btn btn-primary w-100">
                    התחבר
                </button>
            </form>
        </div>
    </>
}
export default Login;