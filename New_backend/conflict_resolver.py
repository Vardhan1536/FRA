
# Updated conflict_agent_auto.py
import geopandas as gpd
from shapely.geometry import Polygon, MultiPolygon
import warnings
from an_exp import GLOBAL_APPLICATIONS  # Import GLOBAL_APPLICATIONS, remove GLOBAL_VILLAGES if not needed

class ConflictAgent:
    def __init__(self):
        """
        Automatically loads the titles from GLOBAL_APPLICATIONS.
        """
        self.all_titles = [
            {
                "beneficiary_id": app["beneficiary_id"],
                "title_id": app["title_id"],
                "village_id": app["admin_info"]["village_id"],
                "polygon_coordinates": app["title_info"]["polygon_coordinates"],
                "right_type": app["title_info"]["right_type"]
            }
            for app in GLOBAL_APPLICATIONS
        ]

    @staticmethod
    def _coords_to_shapely(coords_list):
        polygons = []
        for coords in coords_list:
            try:
                polygons.append(Polygon(coords))
            except Exception as e:
                warnings.warn(f"Invalid polygon coords: {e}")
        if len(polygons) == 1:
            return polygons[0]
        elif len(polygons) > 1:
            return MultiPolygon(polygons)
        else:
            return None

    @staticmethod
    def _check_overlap(poly1, poly2):
        if poly1 is None or poly2 is None:
            return False
        return poly1.intersects(poly2)

    def detect_conflicts(self, beneficiary_id, title_id, polygon_coordinates):
        """
        Detect conflicts for a given beneficiary + title using only polygon coordinates.
        """
        # Find village_id for this title from loaded data
        my_title = next((t for t in self.all_titles if t["beneficiary_id"] == beneficiary_id and t["title_id"] == title_id), None)
        village_id = my_title["village_id"] if my_title else None

        my_polygon = self._coords_to_shapely(polygon_coordinates)
        conflicts = []

        for other in self.all_titles:
            # Skip self or different village
            if other["beneficiary_id"] == beneficiary_id and other["title_id"] == title_id:
                continue
            if village_id and other["village_id"] != village_id:
                continue
            other_polygon = self._coords_to_shapely(other.get("polygon_coordinates", []))
            if self._check_overlap(my_polygon, other_polygon):
                conflicts.append({
                    "conflicting_title_id": other["title_id"],
                    "other_beneficiary_id": other["beneficiary_id"]
                })

        return {
            "conflict_detected": len(conflicts) > 0,
            "conflicts": conflicts
        }


# -------------------------
# Example usage
# -------------------------
if __name__ == "__main__":
    agent = ConflictAgent()

    # Example input from eligibility agent
    beneficiary_id = "FRA_00000020"
    title_id = "FRA_TITLE_00000014"
    polygon_coordinates = [
        [
            [80.54635212060894, 22.79320098273347],
            [80.54602495210914, 22.793732930673524],
            [80.54504098599959, 22.793350670018256],
            [80.54396184629934, 22.793092738078585],
            [80.54531552764372, 22.79101500280458],
            [80.54601006158536, 22.791188448636703],
            [80.54635212060894, 22.79320098273347]
        ]
    ]

    result = agent.detect_conflicts(beneficiary_id, title_id, polygon_coordinates)
    print(result)


