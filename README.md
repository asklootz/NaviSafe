# README Dokumentasjon



# Test Scenarios

The objective of this Test Scenario is to verify that users can submit data, interact with the map and have their location accurately tracked

Preconditions:
This test scenario assumes the following:
•   The pilot is logged in their account
•   The pilot has service
•   The pilot is using an IOS Device with Safari or Google Chrome

## TS-01
Input:  Submit an obstacle with type, height, a description and a pin.
Expected result: The obstacle is submitted and appears on the map
Actual result: The obstacle is displayed on the map

## TS-02
Input: Submit an Obstacle with Type, Height and Description but without pin
Expected result: the helicopter’s live location will be used instead of the pin
Actual result: Feature not available, the registration goes through, but there is no marker on the map

## TS-03
Input: Submitting just a pin without any fields
Expected result: a pin is dropped and the registration can be completed later
Actual result: Feature not available, you will be asked to fill the fields

## TS-04
Drag and drop a pin on the map
Expected result: A pin is dropped on the map
Actual result: A pin is dropped on the map and the live tracker disappears

## TS-05
Verify the location trackers accuracy, Three devices were tested after the group noticed a difference in how accurate our devices and browsers were. 
Expected results: Tracker inaccuracy does not exceed 50 meters
Actual result: 
•   iPhone 14 Plus’s accuracy constantly changed between 5-31 Meters
•   Windows 11 Laptop was tested with Opera GX, giving either 4911 or 22.5 meters and Google Chrome with 128 Meters of inaccuracy
•   MacBook M1 Pro had an accuracy of 35 Meters

The iPhone 14 Plus and MacBook's results are satisfactory, while the laptop's range was too unstable.
Note that the group did not have any working iPads available, so an iPhone was used as a substitute 
