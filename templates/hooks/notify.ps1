param(
    [string]$Title = "Claude Code",
    [string]$Message = "Needs your attention"
)

# Requires BurntToast module:
#   Install-Module -Name BurntToast -Scope CurrentUser -Force
#
# Optional: set -AppLogo to a local PNG for a custom icon.
# Download the Claude spark icon (or any image) and point to it:
#   -AppLogo "C:\path\to\icon.png"

Import-Module BurntToast
New-BurntToastNotification -Text $Title, $Message
