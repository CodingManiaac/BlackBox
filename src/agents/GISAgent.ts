import { BaseAgent } from './BaseAgent';
import { RequestContext } from '../types/context';
import facilityLocations from '../knowledge/facilityLocations.json';
import { RoutingService } from '../services/RoutingService';

export class GISAgent extends BaseAgent {
  async execute(context: RequestContext): Promise<RequestContext> {
    const start = Date.now();
    const triageOutput = context.agentOutputs.find(out => out.agentId === 'triage')?.output;
    const eceOutput = context.agentOutputs.find(out => out.agentId === 'ece')?.output;
    
    // Choose facility category
    let targetType: 'Pharmacy' | 'Hospital' | 'BloodBank' = 'Pharmacy';
    if (eceOutput && eceOutput.eceLevel <= 2) {
      targetType = 'Hospital';
    }
    if (triageOutput && triageOutput.detectedBloodGroup) {
      targetType = 'BloodBank';
    }

    // Identify nearest facility in database coordinates lists
    const matchedFacilities = facilityLocations.facilities.filter(f => f.type === targetType);
    let closestFacility = facilityLocations.facilities[0];
    
    if (matchedFacilities.length > 0) {
      closestFacility = matchedFacilities.reduce((prev, curr) => prev.distanceKm < curr.distanceKm ? prev : curr);
    }

    const facilityCoordinates: Record<string, string> = {
      "City Trauma Emergency Room": "40.7128, -74.0060",
      "Metro General Hospital": "40.7589, -73.9851",
      "Care Pharmacy Store": "40.7410, -73.9890",
      "St. Jude Pediatrics Clinic": "40.7850, -73.9680",
      "Central Red Cross Blood Bank": "40.7711, -73.9741"
    };

    const patientLoc = "40.7128, -74.0060"; // Seed coordinates
    const facilityLoc = facilityCoordinates[closestFacility.name] || "40.7128, -74.0060";

    const route = await RoutingService.calculateRoute(patientLoc, facilityLoc);

    const gisOutput = {
      facility: closestFacility.name,
      facilityType: closestFacility.type,
      distance: `${route.distanceKm} km`,
      eta: `${route.durationMins} mins`,
      provider: route.provider,
      confidence: 94.0
    };

    const nextContext: RequestContext = {
      ...context,
      agentOutputs: [...context.agentOutputs, {
        agentId: this.id,
        timestamp: Date.now(),
        output: gisOutput,
        confidence: 94.0,
        latencyMs: Date.now() - start
      }],
      executionTimeline: [...context.executionTimeline, {
        timestamp: Date.now(),
        stepName: this.name,
        status: 'FINISHED',
        message: `Routed to closest facility: ${closestFacility.name} (${closestFacility.distanceKm} km).`
      }]
    };

    return nextContext;
  }
}
export default GISAgent;
