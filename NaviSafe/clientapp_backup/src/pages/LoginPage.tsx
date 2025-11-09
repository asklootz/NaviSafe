import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import naviSafeLogo from '../assets/NaviSafe_logo.png';

interface LoginScreenProps {
    onLogin: (username: string, password: string) => Promise<boolean>;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { theme, toggleTheme } = useTheme();

    // Load saved username on mount
    useEffect(() => {
        const savedUsername = localStorage.getItem('navisafe_remembered_username');
        if (savedUsername) {
            setUsername(savedUsername);
            setRememberMe(true);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch("https://localhost:5169/api/account/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: username, password }),
            });

            if (!response.ok) {
                setError("Invalid username or password");
                return;
            }

            const data = await response.json();
            console.log("Login success:", data);

            if (rememberMe) {
                localStorage.setItem("navisafe_remembered_username", username);
            } else {
                localStorage.removeItem("navisafe_remembered_username");
            }

            alert("Login successful!");
        } catch (err) {
            setError("Login failed. Please try again later.");
        }


        if (success) {
            // Save username if remember me is checked
            if (rememberMe) {
                localStorage.setItem('navisafe_remembered_username', username);
            } else {
                localStorage.removeItem('navisafe_remembered_username');
            }
        } else {
            setError('Invalid username or password');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <div className="absolute top-4 right-4">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? (
                        <Moon className="h-5 w-5" />
                    ) : (
                        <Sun className="h-5 w-5" />
                    )}
                </Button>
            </div>
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-48 h-48 flex items-center justify-center">
                        <img src={naviSafeLogo} alt="NaviSafe Logo" className="w-full h-full object-contain" />
                    </div>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>
                        Welcome to NaviSafe reporting system
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Enter username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="remember"
                                checked={rememberMe}
                                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                            />
                            <Label
                                htmlFor="remember"
                                className="text-sm cursor-pointer"
                            >
                                Remember me
                            </Label>
                        </div>
                        {error && (
                            <div className="text-red-500 text-sm">{error}</div>
                        )}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </Button>
                        <div className="text-xs text-center text-gray-500 mt-4">
                            Demo users: pilot1, pilot2 (pilots) | admin (administrator)
                            <br />
                            Password: any
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}