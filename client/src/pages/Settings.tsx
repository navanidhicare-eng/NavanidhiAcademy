import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function Settings() {
  const { theme, setTheme, toggleTheme } = useTheme();

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account and application preferences">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dark/Light Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Dark Mode</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Switch between light and dark themes for better viewing experience
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Sun className="h-4 w-4 text-yellow-500" />
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                  className="data-[state=checked]:bg-blue-600"
                />
                <Moon className="h-4 w-4 text-blue-500" />
              </div>
            </div>

            {/* Theme Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Theme Preference</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                    theme === 'light' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Sun className="h-5 w-5 text-yellow-500" />
                  <div className="text-left">
                    <div className="font-medium">Light</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Bright and clean</div>
                  </div>
                </button>

                <button
                  onClick={() => setTheme('dark')}
                  className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                    theme === 'dark' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Moon className="h-5 w-5 text-blue-500" />
                  <div className="text-left">
                    <div className="font-medium">Dark</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Easy on the eyes</div>
                  </div>
                </button>

                <button
                  onClick={() => setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')}
                  className="p-4 border-2 rounded-lg flex items-center gap-3 transition-colors border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                >
                  <Monitor className="h-5 w-5 text-gray-500" />
                  <div className="text-left">
                    <div className="font-medium">System</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Match device</div>
                  </div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Application Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Notifications</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive notifications for important updates
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Auto-save</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically save changes as you work
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Compact View</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Show more data in less space
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* About Section */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Application</span>
                <span className="text-gray-600 dark:text-gray-400">Navanidhi Academy Management</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Version</span>
                <span className="text-gray-600 dark:text-gray-400">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Last Updated</span>
                <span className="text-gray-600 dark:text-gray-400">August 2025</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}