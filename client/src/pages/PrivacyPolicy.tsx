
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield, Eye, UserCheck, FileText, Lock, Globe } from 'lucide-react';
import { useLocation } from 'wouter';

export function PrivacyPolicy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-green-600 hover:bg-green-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <img src="/navanidhi-logo.png" alt="Navanidhi Academy" className="w-6 h-6 object-contain" />
              </div>
              <span className="text-lg font-semibold text-green-800">Navanidhi Academy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card className="shadow-lg border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Shield className="h-6 w-6" />
              Privacy Policy
            </CardTitle>
            <p className="text-green-100 text-sm">
              Last updated: January 2025 | Effective Date: January 1, 2025
            </p>
          </CardHeader>
          
          <CardContent className="p-8 space-y-8">
            {/* Introduction */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-800">Introduction</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                At Navanidhi Academy, we are committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our educational platform and services.
              </p>
            </div>

            {/* Information We Collect */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-800">Information We Collect</h2>
              </div>
              <div className="space-y-3">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-2">Personal Information</h3>
                  <ul className="text-gray-600 space-y-1 text-sm list-disc list-inside">
                    <li>Name, email address, phone number</li>
                    <li>Educational background and academic records</li>
                    <li>Payment and billing information</li>
                    <li>SO Center identification details</li>
                  </ul>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">Usage Information</h3>
                  <ul className="text-gray-600 space-y-1 text-sm list-disc list-inside">
                    <li>Learning progress and assessment results</li>
                    <li>Platform interaction data and study patterns</li>
                    <li>Device information and IP addresses</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How We Use Your Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-800">How We Use Your Information</h2>
              </div>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Provide and maintain our educational services and platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Track learning progress and provide personalized educational content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Process payments and manage billing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Communicate with you about your account and services</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Improve our services and develop new features</span>
                </li>
              </ul>
            </div>

            {/* Data Security */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-800">Data Security</h2>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm leading-relaxed">
                  We implement appropriate technical and organizational security measures to protect your personal information 
                  against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure server 
                  infrastructure, and regular security audits.
                </p>
              </div>
            </div>

            {/* Information Sharing */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-800">Information Sharing</h2>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, 
                except as described in this policy. We may share information with trusted partners who assist us in operating 
                our platform, conducting our business, or serving our users, provided they agree to keep this information confidential.
              </p>
            </div>

            {/* Your Rights */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Your Rights</h2>
              <div className="bg-green-50 p-4 rounded-lg">
                <ul className="text-gray-600 space-y-1 text-sm list-disc list-inside">
                  <li>Access and review your personal information</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your personal information</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Data portability upon request</li>
                </ul>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4 border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800">Contact Us</h2>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm leading-relaxed">
                  If you have any questions about this Privacy Policy or our data practices, please contact us at:
                </p>
                <div className="mt-3 text-sm text-green-700">
                  <p><strong>Email:</strong> privacy@navanidhi-academy.com</p>
                  <p><strong>Address:</strong> Navanidhi Academy Privacy Office</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
