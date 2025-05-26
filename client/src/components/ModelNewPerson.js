import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { CreatePerson, UpdatePerson } from '../servieces/People';

const ModelNewPerson = ({ showModal, setShowModal, updatePerson, isEdit, setisEdit }) => {
    useEffect(() => {
        console.log(isEdit,"updatePerson")
        if(isEdit){
            console.log(updatePerson)
            setNewPerson(updatePerson)}
     }, [showModal])
    const [error, setError] = useState("");
    const [newPerson, setNewPerson] = useState({
        full_name: '',
        phone: '',
        address: '',
        email: '',
        notes: '',
        id: ''
    });
    const handleClose = () => {
        setShowModal(false);
        setNewPerson({
            full_name: '',
            phone: '',
            address: '',
            email: '',
            notes: '',
            id: ''
        });
        if(isEdit)
        setisEdit(false)
    };
    const handleChange = (e) => {
        setNewPerson({ ...newPerson, [e.target.name]: e.target.value });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Submitting new person:', newPerson);
        try {
            let res;
            if (isEdit)
                res = await UpdatePerson(newPerson.id, newPerson.full_name, newPerson.phone, newPerson.address, newPerson.email, newPerson.notes);
            else
                res = await CreatePerson(newPerson.id, newPerson.full_name, newPerson.phone, newPerson.address, newPerson.email, newPerson.notes);
            handleClose();
            setError('')
        } catch (err) {
            setError(err.response.data)
            if (err.response?.status === 403 || err.response?.status === 401) {
                console.log("אין הרשאה");
            } else {
                console.log(err);
            }
        }
    };
    return <>
        <Modal show={showModal} onHide={handleClose} dir="rtl">
            <Modal.Header closeButton>
                <Modal.Title> {isEdit ? 'טופס עדכון' : 'טופס צור איש'} </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    {!isEdit && <Form.Group className="mb-3" controlId="fullName">
                        <Form.Label>תעודת זהות </Form.Label>
                        <Form.Control
                            type="number"
                            name="id"
                            value={newPerson.id}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>}
                    <Form.Group className="mb-3" controlId="fullName">
                        <Form.Label>שם מלא</Form.Label>
                        <Form.Control
                            type="text"
                            name="full_name"
                            value={newPerson.full_name}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="phone">
                        <Form.Label>טלפון</Form.Label>
                        <Form.Control
                            type="text"
                            name="phone"
                            value={newPerson.phone}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="address">
                        <Form.Label>כתובת</Form.Label>
                        <Form.Control
                            type="text"
                            name="address"
                            value={newPerson.address}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="email">
                        <Form.Label>אימייל</Form.Label>
                        <Form.Control
                            type="email"
                            name="email"
                            value={newPerson.email}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="notes">
                        <Form.Label>הערות</Form.Label>
                        <Form.Control
                            as="textarea"
                            name="notes"
                            value={newPerson.notes}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    <Button variant="primary" type="submit">שמור</Button>
                    {error && <div className="text-danger mb-3">{error}</div>}
                </Form>
            </Modal.Body>
        </Modal>
    </>
}
export default ModelNewPerson;