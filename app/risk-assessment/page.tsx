"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AlertCircle, CheckCircle, Info, MapPin, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import Script from "next/script"
import serviceLineData from "./service_line_predictions.json"

export default function RiskAssessmentPage() {
  const searchParams = useSearchParams()
  const [address, setAddress] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const addressInputRef = useRef(null)
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)

  // Get address and zipCode from URL query parameters on page load
  useEffect(() => {
    const addressParam = searchParams.get("address")
    const zipCodeParam = searchParams.get("zipCode")

    if (addressParam) setAddress(addressParam)
    if (zipCodeParam) setZipCode(zipCodeParam)

    // If both parameters are present, automatically submit the form
    if (addressParam && zipCodeParam) {
      handleSubmit(new Event("submit") as any)
    }
  }, [searchParams])

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (googleMapsLoaded && addressInputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        componentRestrictions: { country: "us" },
        fields: ["address_components", "formatted_address"],
        types: ["address"],
      })

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace()

        if (!place.address_components) return

        // Extract address and zip code from the selected place
        let streetNumber = ""
        let route = ""
        let zipCode = ""

        for (const component of place.address_components) {
          const componentType = component.types[0]

          if (componentType === "street_number") {
            streetNumber = component.long_name
          } else if (componentType === "route") {
            route = component.long_name
          } else if (componentType === "postal_code") {
            zipCode = component.long_name
          }
        }

        // Set the address and zip code
        setAddress(`${streetNumber} ${route}`.trim())
        setZipCode(zipCode)
      })
    }
  }, [googleMapsLoaded])

  // Replace the findAddressData function with this improved version
  const findAddressData = (searchAddress) => {
    // Normalize the search address
    const normalizedSearchAddress = normalizeAddress(searchAddress)

    // Find the matching address in the data
    const foundProperty = serviceLineData.find((property) => {
      // Normalize the property address
      const normalizedPropertyAddress = normalizeAddress(property.propertyAddress)

      // Check for exact match first
      if (normalizedPropertyAddress === normalizedSearchAddress) {
        return true
      }

      // Check if the normalized search address is contained in the property address
      // or vice versa (for partial matches)
      return (
        normalizedPropertyAddress.includes(normalizedSearchAddress) ||
        normalizedSearchAddress.includes(normalizedPropertyAddress)
      )
    })

    return foundProperty
  }

  // Add this new function to normalize addresses
  const normalizeAddress = (address) => {
    if (!address) return ""

    let normalized = address.trim().toUpperCase()

    // Replace directional words with abbreviations
    const directionals = {
      NORTH: "N",
      SOUTH: "S",
      EAST: "E",
      WEST: "W",
      NORTHEAST: "NE",
      NORTHWEST: "NW",
      SOUTHEAST: "SE",
      SOUTHWEST: "SW",
    }

    // Replace street type words with abbreviations
    const streetTypes = {
      STREET: "ST",
      AVENUE: "AVE",
      BOULEVARD: "BLVD",
      DRIVE: "DR",
      ROAD: "RD",
      LANE: "LN",
      PLACE: "PL",
      COURT: "CT",
      TERRACE: "TER",
      CIRCLE: "CIR",
      HIGHWAY: "HWY",
      PARKWAY: "PKWY",
    }

    // Replace full directional words with abbreviations
    Object.entries(directionals).forEach(([word, abbr]) => {
      // Replace the word as a standalone word
      normalized = normalized.replace(new RegExp(`\\b${word}\\b`, "g"), abbr)
    })

    // Replace full street type words with abbreviations
    Object.entries(streetTypes).forEach(([word, abbr]) => {
      // Replace the word as a standalone word
      normalized = normalized.replace(new RegExp(`\\b${word}\\b`, "g"), abbr)
    })

    // Remove common filler words and punctuation
    normalized = normalized.replace(/\bAPT\b|\bUNIT\b|\bSUITE\b|\bSTE\b|\bFLOOR\b|\bFL\b|\b#\b/g, "")
    normalized = normalized.replace(/[.,#;:'"]/g, "")

    // Remove extra spaces
    normalized = normalized.replace(/\s+/g, " ").trim()

    return normalized
  }

  // Generate recommendations based on risk level
  const getRecommendations = (riskScore) => {
    if (riskScore >= 70) {
      return [
        "Use cold water for drinking and cooking",
        "Let water run for 3-5 minutes before using",
        "Consider installing an NSF-certified water filter",
        "Schedule a professional water test",
        "Contact the city about lead service line replacement options",
      ]
    } else if (riskScore >= 30) {
      return [
        "Use cold water for drinking and cooking",
        "Let water run for 1-3 minutes before using",
        "Consider a water filter certified for lead removal",
        "Test your water annually",
      ]
    } else {
      return [
        "Use cold water for drinking and cooking",
        "Run water for 30-60 seconds before using",
        "Consider testing your water every few years",
        "Monitor city announcements about water quality",
      ]
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setNotFound(false)

    // Search for the address in the data
    const foundProperty = findAddressData(address)

    setTimeout(() => {
      setLoading(false)

      if (foundProperty) {
        // Create result object with the found data
        const resultData = {
          ...foundProperty,
          recommendations: getRecommendations(foundProperty.riskScore),
        }

        setResult(resultData)
        setSubmitted(true)
      } else {
        // Address not found
        setNotFound(true)
        setSubmitted(false)
      }
    }, 1500)
  }

  const getRiskLevel = (score) => {
    if (score < 30) return { level: "Low", color: "text-green-600" }
    if (score < 70) return { level: "Moderate", color: "text-yellow-600" }
    return { level: "High", color: "text-red-600" }
  }

  const risk = result ? getRiskLevel(result.riskScore) : { level: "", color: "" }

  return (
    <>
      {/* Google Maps JavaScript API Script */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyAmdsuLZPLfpC1jWLstX72qxzkF31wn5zw&libraries=places`}
        onLoad={() => setGoogleMapsLoaded(true)}
      />

      <div className="container mx-auto px-4 py-12">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Lead Risk Assessment</h1>
            <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Check your address to assess your risk of lead service lines and contamination
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Address Lookup</CardTitle>
                <CardDescription>Enter your Chicago address to check your risk</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      ref={addressInputRef}
                      placeholder="Start typing your address..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      placeholder="60601"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                    {loading ? (
                      <>Analyzing...</>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" /> Check Address
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col items-start">
                <p className="text-sm text-gray-500">
                  We only use publicly available data and do not store your address information.
                </p>
              </CardFooter>
            </Card>

            <div className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>How we assess risk</AlertTitle>
                <AlertDescription>
                  Our risk assessment uses machine learning models trained on Chicago property data, service line
                  information, and water testing results. We analyze factors like property age, location, and historical
                  data to estimate your risk.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Understanding Your Results</CardTitle>
                  <CardDescription>Our assessment provides several key pieces of information:</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Risk Score</h4>
                      <p className="text-sm text-gray-500">
                        A score from 0-100 indicating your overall risk level based on multiple factors
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <MapPin className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Service Line Status</h4>
                      <p className="text-sm text-gray-500">
                        The predicted material of your public and private service lines
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Property Information</h4>
                      <p className="text-sm text-gray-500">
                        Details about your property including year built and neighborhood
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {notFound && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Address Not Found</AlertTitle>
              <AlertDescription>
                We couldn't find your address in our database. Please check the address and try again, or try a nearby
                address.
              </AlertDescription>
            </Alert>
          )}

          {submitted && result && (
            <Card className="mt-8 border-t-4 border-t-blue-600">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Results for {result.propertyAddress}, {zipCode}
                  <span className={`text-lg ${risk.color}`}>{risk.level} Risk</span>
                </CardTitle>
                <CardDescription>Based on our predictive models and available data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Risk Score: {result.riskScore}/100</span>
                    <span className={`text-sm ${risk.color}`}>{risk.level}</span>
                  </div>
                  <Progress value={result.riskScore} className="h-2" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium">Public Service Line</h4>
                    <p className="text-sm">{result.publicServiceLine}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Private Service Line</h4>
                    <p className="text-sm">{result.privateServiceLine}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Property Information</h4>
                    <div className="text-sm">
                      <p>Year Built: {result.propertyInfo.yearBuilt}</p>
                      <p>Neighborhood: {result.propertyInfo.townshipName}</p>
                      <p>Ward: {result.propertyInfo.ward}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Recommendations</h4>
                    <ul className="text-sm space-y-1">
                      {result.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle>What does this mean?</AlertTitle>
                  <AlertDescription>
                    Your property has a {risk.level.toLowerCase()} risk of having lead service lines and lead
                    contamination in your water.{" "}
                    {risk.level === "High"
                      ? "We strongly recommend taking immediate action to reduce your exposure to lead."
                      : risk.level === "Moderate"
                        ? "We recommend taking precautions to reduce potential lead exposure."
                        : "Your risk appears to be low, but it's still good practice to follow basic precautions."}
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-4">
                <p className="text-sm text-gray-500">
                  This assessment is based on predictive modeling and available data. For definitive results, we
                  recommend professional testing.
                </p>
                <div className="flex gap-3">
                  <Link href="/resources">
                    <Button variant="outline">View Resources</Button>
                  </Link>
                  <Link href="/data">
                    <Button variant="outline">Learn About Our Data</Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

