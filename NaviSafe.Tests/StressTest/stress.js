import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 20 },  // Ramp up
        { duration: '1m', target: 50 },   // Peak
        { duration: '30s', target: 0 },   // Ramp down
    ],
};

export default function () {
    http.get('http://navisafe_app:8080/');
    sleep(1);
}