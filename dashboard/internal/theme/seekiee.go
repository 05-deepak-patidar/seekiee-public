package theme

import "github.com/charmbracelet/lipgloss"

// newSeekiee returns the Seekiee dark theme: orange + purple accents on a
// slate-dark neutral base, per the Seekiee brand kit (https://darkiee.com).
func newSeekiee() Theme {
	return Theme{
		// Neutrals (dark theme)
		Base:    lipgloss.Color("#0F172A"), // BG Primary
		Surface: lipgloss.Color("#1E293B"), // BG Secondary
		Overlay: lipgloss.Color("#334155"), // BG Tertiary
		Text:    lipgloss.Color("#F1F5F9"), // Text Primary
		Subtext: lipgloss.Color("#94A3B8"), // muted slate

		// Accents — brand orange (action) + purple (intelligence) lead.
		Peach:  lipgloss.Color("#F77F03"), // brand orange (primary/action)
		Pink:   lipgloss.Color("#FF8D28"), // brand orange light
		Mauve:  lipgloss.Color("#8B5CF6"), // brand purple (AI/automation)
		Blue:   lipgloss.Color("#3B82F6"), // info
		Sky:    lipgloss.Color("#38BDF8"), // info light
		Green:  lipgloss.Color("#10B981"), // success
		Yellow: lipgloss.Color("#F59E0B"), // warning
		Red:    lipgloss.Color("#EF4444"), // error
	}
}
