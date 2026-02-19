const API_URL = 'http://localhost:5000/api';
let token = '';
let userId = '';
let groupId = '';

async function testFlow() {
    try {
        console.log('🚀 Starting API Test Flow...');

        // 1. Register User
        const uniqueEmail = `test${Date.now()}@example.com`;
        console.log(`\n👤 Registering user: ${uniqueEmail}`);

        try {
            const registerRes = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test User',
                    email: uniqueEmail,
                    password: 'password123'
                })
            });
            const registerData = await registerRes.json();

            if (!registerRes.ok) throw new Error(registerData.message || 'Registration failed');

            console.log('✅ Registration Successful');
            token = registerData.token;
            userId = registerData._id;
        } catch (error) {
            console.error('❌ Registration Failed:', error.message);
            return;
        }

        // 2. Create Group
        console.log('\n👥 Creating Group...');
        try {
            const groupRes = await fetch(`${API_URL}/groups`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: 'Test Trip',
                    type: 'Trip',
                    description: 'Testing API'
                })
            });
            const groupData = await groupRes.json();

            if (!groupRes.ok) throw new Error(groupData.message || 'Group creation failed');

            console.log('✅ Group Created:', groupData.name);
            groupId = groupData._id;
        } catch (error) {
            console.error('❌ Group Creation Failed:', error.message);
        }

        // 3. Add Expense
        console.log('\n💰 Adding Expense...');
        try {
            const expenseRes = await fetch(`${API_URL}/expenses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: 'Test Dinner',
                    amount: 100,
                    category: 'Food',
                    group: groupId,
                    isSplit: true,
                    numberOfPeople: 2,
                    splitWith: ['friend@example.com']
                })
            });
            const expenseData = await expenseRes.json();

            if (!expenseRes.ok) throw new Error(expenseData.message || 'Expense addition failed');

            console.log('✅ Expense Added:', expenseData.title);
            console.log('   Amount:', expenseData.amount);
            console.log('   Split:', expenseData.isSplit);
            console.log('   Number of People:', expenseData.numberOfPeople);
        } catch (error) {
            console.error('❌ Expense Addition Failed:', error.message);
        }

        // 4. Verify Dashboard Data
        console.log('\n📊 Verifying Dashboard Data...');
        try {
            const expensesRes = await fetch(`${API_URL}/expenses`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const expensesData = await expensesRes.json();

            if (!expensesRes.ok) throw new Error(expensesData.message || 'Fetch expenses failed');

            console.log('✅ Expenses Fetched:', expensesData.length);
            const myExpense = expensesData[0];
            if (myExpense && myExpense.title === 'Test Dinner') {
                console.log('✅ Verified Expense Exists');
            } else {
                console.error('❌ Expense Validation Failed');
            }
        } catch (error) {
            console.error('❌ Fetch Expenses Failed:', error.message);
        }

        console.log('\n✨ Test Flow Completed Successfully!');

    } catch (error) {
        console.error('🚨 Test Flow Error:', error.message);
    }
}

testFlow();
