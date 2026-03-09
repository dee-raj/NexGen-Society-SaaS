import readline from "readline";
import { Role } from "@shared/utils/constants";
import { connectDatabase } from "@config/database";
import { AuthService } from "@modules/auth/auth.service";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const ask = (question: string): Promise<string> => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer.trim()));
    });
};

// Regex patterns
const phoneRegex = /^\+?[\d\s-]{10,15}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

async function askEmail(): Promise<string> {
    while (true) {
        const email = await ask("Enter email: ");
        if (emailRegex.test(email)) return email;
        console.log("❌ Invalid email format. Try again.");
    }
}

async function askPhone(): Promise<string | undefined> {
    while (true) {
        const phone = await ask("Enter phone (optional): ");

        if (!phone) return undefined;
        if (phoneRegex.test(phone)) return phone;

        console.log("❌ Invalid phone number. Use 10-15 digits.");
    }
}

async function askPassword(): Promise<string> {
    while (true) {
        const password = await ask("Enter password: ");
        if (passwordRegex.test(password)) return password;
        console.log("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
    }
}

(async () => {
    try {
        const username = await ask("Enter username: ");
        const email = await askEmail();
        const password = await askPassword();
        const phone = await askPhone();

        if (!username || !password) {
            console.log("❌ Username and password are required.");
            process.exit(1);
        }

        // Connect to data stores
        await connectDatabase();
        const { user } = await AuthService.register({
            email,
            phone,
            password,
            fullName: username,
            role: Role.SUPER_ADMIN,
        });

        console.log("✅ Super user created!");
        console.log("User:", user);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        rl.close();
        process.exit(0);
    }
})();
