namespace NaviSafe.Models
{
    public class AdminReportViewModel
    {
        public NaviSafe.Data.ObstacleData Report { get; set; } = null!;
        public NaviSafe.Data.UserInfo? Reporter { get; set; }
        public string OrganizationName { get; set; } = string.Empty;
    }
}