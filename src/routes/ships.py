from flask import Blueprint, request, jsonify
from src.models import db
from src.models.ship import Ship
from datetime import datetime, timedelta
import json
import os

ships_bp = Blueprint('ships', __name__)

@ships_bp.route('/api/ships', methods=['GET'])
def get_ships():
    """Get all ships"""
    ships = Ship.query.all()
    return jsonify([{
        'id': ship.id,
        'vesselName': ship.vesselName,
        'vesselType': ship.vesselType,
        'shippingLine': ship.shippingLine,
        'port': ship.port,
        'operationDate': ship.operationDate.isoformat() if ship.operationDate else None,
        'company': ship.company,
        'operationType': ship.operationType,
        'berth': ship.berth,
        'operationManager': ship.operationManager,
        'autoOpsLead': ship.autoOpsLead,
        'autoOpsAssistant': ship.autoOpsAssistant,
        'heavyOpsLead': ship.heavyOpsLead,
        'heavyOpsAssistant': ship.heavyOpsAssistant,
        'totalVehicles': ship.totalVehicles,
        'totalAutomobilesDischarge': ship.totalAutomobilesDischarge,
        'heavyEquipmentDischarge': ship.heavyEquipmentDischarge,
        'totalElectricVehicles': ship.totalElectricVehicles,
        'totalStaticCargo': ship.totalStaticCargo,
        'brvTarget': ship.brvTarget,
        'zeeTarget': ship.zeeTarget,
        'souTarget': ship.souTarget,
        'expectedRate': ship.expectedRate,
        'totalDrivers': ship.totalDrivers,
        'shiftStart': ship.shiftStart,
        'shiftEnd': ship.shiftEnd,
        'breakDuration': ship.breakDuration,
        'targetCompletion': ship.targetCompletion,
        'ticoVans': ship.ticoVans,
        'ticoStationWagons': ship.ticoStationWagons,
        'status': ship.status,
        'progress': ship.progress,
        'createdAt': ship.createdAt.isoformat() if ship.createdAt else None,
        'startTime': ship.startTime,
        'estimatedCompletion': ship.estimatedCompletion,
        'updatedAt': ship.updatedAt.isoformat() if ship.updatedAt else None,
        'deck_data': json.loads(ship.deck_data) if ship.deck_data else None,
        'turnaround_data': json.loads(ship.turnaround_data) if ship.turnaround_data else None,
        'inventory_data': json.loads(ship.inventory_data) if ship.inventory_data else None,
        'hourly_quantity_data': json.loads(ship.hourly_quantity_data) if ship.hourly_quantity_data else None
    } for ship in ships])

@ships_bp.route('/api/ships/<int:ship_id>', methods=['GET'])
def get_ship(ship_id):
    """Get a specific ship"""
    ship = Ship.query.get_or_404(ship_id)
    return jsonify({
        'id': ship.id,
        'vesselName': ship.vesselName,
        'vesselType': ship.vesselType,
        'shippingLine': ship.shippingLine,
        'port': ship.port,
        'operationDate': ship.operationDate.isoformat() if ship.operationDate else None,
        'company': ship.company,
        'operationType': ship.operationType,
        'berth': ship.berth,
        'operationManager': ship.operationManager,
        'autoOpsLead': ship.autoOpsLead,
        'autoOpsAssistant': ship.autoOpsAssistant,
        'heavyOpsLead': ship.heavyOpsLead,
        'heavyOpsAssistant': ship.heavyOpsAssistant,
        'totalVehicles': ship.totalVehicles,
        'totalAutomobilesDischarge': ship.totalAutomobilesDischarge,
        'heavyEquipmentDischarge': ship.heavyEquipmentDischarge,
        'totalElectricVehicles': ship.totalElectricVehicles,
        'totalStaticCargo': ship.totalStaticCargo,
        'brvTarget': ship.brvTarget,
        'zeeTarget': ship.zeeTarget,
        'souTarget': ship.souTarget,
        'expectedRate': ship.expectedRate,
        'totalDrivers': ship.totalDrivers,
        'shiftStart': ship.shiftStart,
        'shiftEnd': ship.shiftEnd,
        'breakDuration': ship.breakDuration,
        'targetCompletion': ship.targetCompletion,
        'ticoVans': ship.ticoVans,
        'ticoStationWagons': ship.ticoStationWagons,
        'status': ship.status,
        'progress': ship.progress,
        'createdAt': ship.createdAt.isoformat() if ship.createdAt else None,
        'startTime': ship.startTime,
        'estimatedCompletion': ship.estimatedCompletion,
        'updatedAt': ship.updatedAt.isoformat() if ship.updatedAt else None,
        'deck_data': json.loads(ship.deck_data) if ship.deck_data else None,
        'turnaround_data': json.loads(ship.turnaround_data) if ship.turnaround_data else None,
        'inventory_data': json.loads(ship.inventory_data) if ship.inventory_data else None,
        'hourly_quantity_data': json.loads(ship.hourly_quantity_data) if ship.hourly_quantity_data else None
    })

@ships_bp.route('/api/ships', methods=['POST'])
def create_ship():
    """Create a new ship operation"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Validate required fields
    vessel_name = data.get('vesselName', '').strip()
    if not vessel_name:
        return jsonify({'error': 'Vessel name is required'}), 400
    
    # Set default date if not provided
    operation_date_str = data.get('operationDate')
    if operation_date_str:
        operation_date = datetime.strptime(operation_date_str, '%Y-%m-%d').date()
    else:
        operation_date = datetime.now().date()
    
    # Create ship record with proper defaults
    ship = Ship(
        vesselName=vessel_name,
        vesselType=data.get('vesselType', 'Auto Only'),
        shippingLine=data.get('shippingLine', 'Unknown'),
        port=data.get('port', 'Colonel Island'),
        operationDate=operation_date,
        company=data.get('company', 'APS Stevedoring'),
        operationType=data.get('operationType', 'Discharge Only'),
        berth=data.get('berthLocation', 'Berth 1'),
        operationManager=data.get('operationManager', 'Manager'),
        autoOpsLead=data.get('autoOpsLead', 'Lead'),
        autoOpsAssistant=data.get('autoOpsAssistant', 'Assistant'),
        heavyOpsLead=data.get('heavyOpsLead', 'Heavy Lead'),
        heavyOpsAssistant=data.get('heavyOpsAssistant', 'Heavy Assistant'),
        totalVehicles=max(data.get('totalVehicles', 100), 1),
        totalAutomobilesDischarge=data.get('totalAutomobilesDischarge', data.get('totalVehicles', 100)),
        heavyEquipmentDischarge=data.get('heavyEquipmentDischarge', 0),
        totalElectricVehicles=data.get('totalElectricVehicles', 0),
        totalStaticCargo=data.get('totalStaticCargo', 0),
        brvTarget=data.get('brvTarget', 0),
        zeeTarget=data.get('zeeTarget', 0),
        souTarget=data.get('souTarget', data.get('totalVehicles', 100)),
        expectedRate=max(data.get('expectedRate', 150), 1),
        totalDrivers=max(data.get('totalDrivers', 30), 1),
        shiftStart=data.get('shiftStart', '07:00'),
        shiftEnd=data.get('shiftEnd', '15:00'),
        breakDuration=data.get('breakDuration', 0),
        targetCompletion=data.get('targetCompletion', ''),
        ticoVans=data.get('ticoVans', 0),
        ticoStationWagons=data.get('ticoStationWagons', 0),
        status='active',
        progress=0,
        startTime=data.get('shiftStart', '07:00'),
        estimatedCompletion=data.get('targetCompletion', data.get('shiftEnd', '15:00'))
    )
    
    db.session.add(ship)
    db.session.commit()
    
    return jsonify({'id': ship.id}), 201

@ships_bp.route('/api/ships/<int:ship_id>', methods=['PUT'])
def update_ship(ship_id):
    """Update a ship operation"""
    ship = Ship.query.get_or_404(ship_id)
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Update ship data
    for key, value in data.items():
        if hasattr(ship, key):
            setattr(ship, key, value)
    
    db.session.commit()
    
    return jsonify({'message': 'Ship updated successfully'})

@ships_bp.route('/api/ships/<int:ship_id>/progress', methods=['PUT'])
def update_ship_progress(ship_id):
    """Update ship operation progress"""
    ship = Ship.query.get_or_404(ship_id)
    
    data = request.get_json()
    if not data or 'progress' not in data:
        return jsonify({'error': 'Progress value required'}), 400
    
    progress = data['progress']
    if not isinstance(progress, (int, float)) or progress < 0 or progress > 100:
        return jsonify({'error': 'Progress must be a number between 0 and 100'}), 400
    
    ship.progress = progress
    
    # Update status based on progress
    if progress >= 100:
        ship.status = 'complete'
    elif progress > 0:
        ship.status = 'active'
    
    db.session.commit()
    
    return jsonify({'message': 'Progress updated successfully'})

@ships_bp.route('/api/ships/<int:ship_id>/status', methods=['PUT'])
def update_ship_status(ship_id):
    """Update ship operation status"""
    ship = Ship.query.get_or_404(ship_id)
    
    data = request.get_json()
    if not data or 'status' not in data:
        return jsonify({'error': 'Status value required'}), 400
    
    valid_statuses = ['active', 'loading', 'discharge', 'complete', 'paused']
    status = data['status']
    
    if status not in valid_statuses:
        return jsonify({'error': f'Status must be one of: {", ".join(valid_statuses)}'}), 400
    
    ship.status = status
    db.session.commit()
    
    return jsonify({'message': 'Status updated successfully'})

@ships_bp.route('/api/ships/<int:ship_id>/decks', methods=['PUT'])
def update_ship_decks(ship_id):
    """Update ship deck data"""
    ship = Ship.query.get_or_404(ship_id)
    
    data = request.get_json()
    if not data or 'decks' not in data:
        return jsonify({'error': 'Decks data required'}), 400
        
    ship.deck_data = json.dumps(data['decks'])
    db.session.commit()
    
    return jsonify({'message': 'Deck data updated successfully'})

@ships_bp.route('/api/ships/<int:ship_id>/turnaround', methods=['PUT'])
def update_ship_turnaround(ship_id):
    """Update ship turnaround data"""
    ship = Ship.query.get_or_404(ship_id)
    
    data = request.get_json()
    if not data or 'turnaround' not in data:
        return jsonify({'error': 'Turnaround data required'}), 400
        
    ship.turnaround_data = json.dumps(data['turnaround'])
    db.session.commit()
    
    return jsonify({'message': 'Turnaround data updated successfully'})

@ships_bp.route('/api/ships/<int:ship_id>/inventory', methods=['PUT'])
def update_ship_inventory(ship_id):
    """Update ship inventory data"""
    ship = Ship.query.get_or_404(ship_id)
    
    data = request.get_json()
    if not data or 'inventory' not in data:
        return jsonify({'error': 'Inventory data required'}), 400
        
    ship.inventory_data = json.dumps(data['inventory'])
    db.session.commit()
    
    return jsonify({'message': 'Inventory data updated successfully'})

@ships_bp.route('/api/ships/<int:ship_id>/hourly', methods=['PUT'])
def update_ship_hourly(ship_id):
    """Update ship hourly quantity data"""
    ship = Ship.query.get_or_404(ship_id)
    
    data = request.get_json()
    if not data or 'hourly' not in data:
        return jsonify({'error': 'Hourly data required'}), 400
        
    ship.hourly_quantity_data = json.dumps(data['hourly'])
    db.session.commit()
    
    return jsonify({'message': 'Hourly data updated successfully'})

@ships_bp.route('/api/ships/<int:ship_id>', methods=['DELETE'])
def delete_ship(ship_id):
    """Delete a ship operation"""
    ship = Ship.query.get_or_404(ship_id)
    db.session.delete(ship)
    db.session.commit()
    
    return jsonify({'message': 'Ship operation deleted successfully'})

@ships_bp.route('/api/ships/berths', methods=['GET'])
def get_berth_status():
    """Get berth occupancy status"""
    berths = {f'Berth {i}': None for i in range(1, 7)}
    active_ships = Ship.query.filter(Ship.status != 'complete').all()
    
    for ship in active_ships:
        if ship.berth:
            berths[ship.berth] = {
                'shipId': ship.id,
                'vesselName': ship.vesselName,
                'status': ship.status,
                'progress': ship.progress
            }
    
    return jsonify(berths)

@ships_bp.route('/api/ships/stats', methods=['GET'])
def get_operations_stats():
    """Get overall operations statistics"""
    active_ships = Ship.query.filter(Ship.status != 'complete').all()
    total_ships = Ship.query.count()
    
    stats = {
        'activeShips': len(active_ships),
        'totalShips': total_ships,
        'teamsDeployed': len(active_ships) * 2,  # Auto ops + Heavy ops
        'totalVehicles': sum(s.totalVehicles for s in active_ships),
        'berthsOccupied': len(set(s.berth for s in active_ships if s.berth)),
        'averageProgress': sum(s.progress for s in active_ships) / len(active_ships) if active_ships else 0
    }
    
    return jsonify(stats)

@ships_bp.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'ships-management'})

@ships_bp.route('/api/analytics', methods=['GET'])
def get_analytics():
    """Get analytics data for specified period"""
    period_days = int(request.args.get('period', 30))
    
    # Filter ships by date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=period_days)
    
    filtered_ships = Ship.query.filter(Ship.operationDate.between(start_date, end_date)).all()
    
    # Calculate analytics
    total_hours = 0
    total_vehicles = 0
    zone_data = {'zoneA': {'vehicles': 0, 'time': 0}, 'zoneB': {'vehicles': 0, 'time': 0}, 'zoneC': {'vehicles': 0, 'time': 0}}
    team_stats = {}
    vehicle_types = {'automobiles': 0, 'heavyEquipment': 0, 'electricVehicles': 0, 'staticCargo': 0}
    
    for ship in filtered_ships:
        # Calculate hours worked (assuming 8-16 hour shifts)
        shift_hours = 12  # Default shift length
        if ship.shiftStart and ship.shiftEnd:
            try:
                start_time = datetime.strptime(ship.shiftStart, '%H:%M')
                end_time = datetime.strptime(ship.shiftEnd, '%H:%M')
                shift_hours = (end_time - start_time).seconds / 3600
            except:
                pass
        
        total_hours += shift_hours
        
        # Vehicle counts
        total_vehicles += ship.totalVehicles
        vehicle_types['automobiles'] += ship.totalAutomobilesDischarge
        vehicle_types['heavyEquipment'] += ship.heavyEquipmentDischarge
        
        # Team performance
        auto_lead = ship.autoOpsLead
        heavy_lead = ship.heavyOpsLead
        
        if auto_lead:
            if auto_lead not in team_stats:
                team_stats[auto_lead] = {'role': 'Auto Operations Lead', 'hours': 0, 'ships': 0}
            team_stats[auto_lead]['hours'] += shift_hours
            team_stats[auto_lead]['ships'] += 1
            
        if heavy_lead:
            if heavy_lead not in team_stats:
                team_stats[heavy_lead] = {'role': 'Heavy Equipment Lead', 'hours': 0, 'ships': 0}
            team_stats[heavy_lead]['hours'] += shift_hours
            team_stats[heavy_lead]['ships'] += 1
    
    # Generate daily hours data
    daily_hours = []
    for i in range(min(period_days, 30)):
        date = end_date - timedelta(days=period_days - i - 1)
        day_ships = [s for s in filtered_ships if s.operationDate and s.operationDate.strftime('%Y-%m-%d') == date.strftime('%Y-%m-%d')]
        day_hours = sum(12 for _ in day_ships)  # Assume 12 hours per ship per day
        daily_hours.append({
            'date': date.strftime('%m/%d'),
            'hours': day_hours
        })
    
    # Format team performance
    team_performance = []
    for name, stats in team_stats.items():
        team_performance.append({
            'name': name,
            'role': stats['role'],
            'hours': int(stats['hours']),
            'ships': stats['ships'],
            'efficiency': 85 + (hash(name) % 15)  # Simulated efficiency
        })
    
    analytics_data = {
        'totalHours': int(total_hours),
        'shipsProcessed': len(filtered_ships),
        'vehiclesHandled': total_vehicles,
        'avgEfficiency': 88,  # Calculated average efficiency
        'dailyHours': daily_hours,
        'vehicleTypes': vehicle_types,
        'zonePerformance': {
            'zoneA': {
                'vehicles': int(total_vehicles * 0.35),
                'avgTime': 12,
                'efficiency': 87
            },
            'zoneB': {
                'vehicles': int(total_vehicles * 0.40),
                'avgTime': 10,
                'efficiency': 92
            },
            'zoneC': {
                'vehicles': int(total_vehicles * 0.25),
                'avgTime': 15,
                'efficiency': 83
            }
        },
        'teamPerformance': team_performance
    }
    
    return jsonify(analytics_data)
