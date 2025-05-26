import { useEffect, useState } from 'react';
import Table from 'react-bootstrap/Table';
import { GetAllRepayments } from '../servieces/Repaments';
function Repayment() {

    const [repayments, setrepayment] = useState([])
    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await GetAllRepayments()
                setrepayment(res)
            }
            catch (err) {
                if(err.reponse.status==403&&err.reponse.status==401)
                    console.log("")
                console.log(err)
            }
        }
        fetch()
    }, [])
    return (
        <Table striped bordered hover size="sm">
            <thead>
                <tr>
                    <th>#</th>
                    <th>סכום</th>
                    <th>סוג</th>
                    <th>תאור</th>
                </tr>
            </thead>
            <tbody>
                {repayments.map((repayment) => <tr><th>{repayment.amount}</th><th>{repayment.type}</th><th>{repayment.description}</th></tr>)}
            </tbody>
        </Table>
    );
}

export default Repayment;