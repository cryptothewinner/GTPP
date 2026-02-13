
import axios from 'axios';

async function main() {
    const url = 'http://localhost:3001/api/v1/material-batches';
    console.log(`Testing GET ${url}...`);

    try {
        const response = await axios.get(url, {
            params: {
                page: 1,
                pageSize: 5
            }
        });

        console.log('Status:', response.status);
        console.log('Success:', response.data.success);
        console.log('Total Records:', response.data.meta.total);

        if (response.data.data.length > 0) {
            console.log('Sample Batch:', JSON.stringify(response.data.data[0], null, 2));
        } else {
            console.log('No batches found.');
        }

    } catch (error: any) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
    }
}

main();
