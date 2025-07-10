import json
import os
import sys
from datetime import datetime

# Add project root to Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src.main import app, db
from src.models.ship import Ship

def migrate_data():
    with app.app_context():
        # Load data from JSON file
        json_file_path = os.path.join(project_root, 'database', 'ships.json')
        if not os.path.exists(json_file_path):
            print("ships.json not found. No data to migrate.")
            return

        with open(json_file_path, 'r') as f:
            ships_data = json.load(f)

        # Migrate data
        for ship_data in ships_data:
            # Check if ship already exists
            existing_ship = Ship.query.get(ship_data['id'])
            if existing_ship:
                continue

            # Convert date string to date object
            operation_date_str = ship_data.get('operationDate')
            if operation_date_str:
                operation_date = datetime.strptime(operation_date_str, '%Y-%m-%d').date()
            else:
                operation_date = None
                
            # Convert createdAt and updatedAt strings to datetime objects
            created_at_str = ship_data.get('createdAt')
            if created_at_str:
                created_at = datetime.fromisoformat(created_at_str)
            else:
                created_at = None
                
            updated_at_str = ship_data.get('updatedAt')
            if updated_at_str:
                updated_at = datetime.fromisoformat(updated_at_str)
            else:
                updated_at = None


            ship = Ship(
                id=ship_data['id'],
                vesselName=ship_data['vesselName'],
                vesselType=ship_data['vesselType'],
                shippingLine=ship_data['shippingLine'],
                port=ship_data['port'],
                operationDate=operation_date,
                company=ship_data['company'],
                operationType=ship_data['operationType'],
                berth=ship_data['berth'],
                operationManager=ship_data['operationManager'],
                autoOpsLead=ship_data['autoOpsLead'],
                autoOpsAssistant=ship_data['autoOpsAssistant'],
                heavyOpsLead=ship_data['heavyOpsLead'],
                heavyOpsAssistant=ship_data['heavyOpsAssistant'],
                totalVehicles=ship_data['totalVehicles'],
                totalAutomobilesDischarge=ship_data['totalAutomobilesDischarge'],
                heavyEquipmentDischarge=ship_data['heavyEquipmentDischarge'],
                totalElectricVehicles=ship_data['totalElectricVehicles'],
                totalStaticCargo=ship_data['totalStaticCargo'],
                brvTarget=ship_data['brvTarget'],
                zeeTarget=ship_data['zeeTarget'],
                souTarget=ship_data['souTarget'],
                expectedRate=ship_data['expectedRate'],
                totalDrivers=ship_data['totalDrivers'],
                shiftStart=ship_data['shiftStart'],
                shiftEnd=ship_data['shiftEnd'],
                breakDuration=ship_data['breakDuration'],
                targetCompletion=ship_data['targetCompletion'],
                ticoVans=ship_data['ticoVans'],
                ticoStationWagons=ship_data['ticoStationWagons'],
                status=ship_data['status'],
                progress=ship_data['progress'],
                createdAt=created_at,
                startTime=ship_data['startTime'],
                estimatedCompletion=ship_data['estimatedCompletion'],
                updatedAt=updated_at
            )
            db.session.add(ship)

        db.session.commit()
        print(f"Successfully migrated {len(ships_data)} ships to the database.")

if __name__ == '__main__':
    migrate_data()
